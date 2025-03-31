from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict, List, Optional, Text

import requests
import json
import sqlite3
from pathlib import Path
import pandas as pd

import rasa.shared.utils.io
from rasa.engine.graph import ExecutionContext, GraphComponent
from rasa.engine.recipes.default_recipe import DefaultV1Recipe
from rasa.engine.storage.resource import Resource
from rasa.engine.storage.storage import ModelStorage
from rasa.nlu.extractors.extractor import EntityExtractorMixin
from rasa.shared.nlu.constants import ENTITIES, TEXT
from rasa.shared.nlu.training_data.message import Message
from rasa.shared.nlu.training_data.training_data import TrainingData
# from rasa_sdk import Tracker # Removed unused import

import google.generativeai as genai

logger = logging.getLogger(__name__)

def GetDataFromDB(query, db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)

    df = pd.read_sql_query(query, conn)

    data = df.to_dict(orient="records")

    try:
        data = data[0]["data"]
        print("RESPONSE RAW:", data)
        # Convert the JSON string to a Python dictionary
        data = json.loads(data)["value"]

    except Exception as e:
        print("REPONSE EX:", e)
        data = []

    conn.close()

    return data

@DefaultV1Recipe.register(
    DefaultV1Recipe.ComponentType.ENTITY_EXTRACTOR, is_trainable=False
)
class GeminiEntityExtractor(GraphComponent, EntityExtractorMixin):
    """Extracts entities using the language model with JSON mode."""

    @staticmethod
    def get_default_config() -> Dict[Text, Any]:
        """The component's default config (see parent class for full docstring)."""
        return {
            "model_name": "gemini-2.0-flash",
            # gemma-3-27b-it
            "api_key": os.environ.get("GEMINI_API_KEY"),
            "timeout": 10,
            "db_path": "/workspaces/Rasa_challenge/rasa.db",  # Added db_path to config
        }

    def __init__(self, config: Dict[Text, Any]) -> None:
        """Creates the extractor."""
        self.component_config = {**self.get_default_config(), **config}
        self._model_name = self.component_config.get("model_name")
        self._api_key = self.component_config.get("api_key")
        self._timeout = self.component_config.get("timeout")
        self._db_path = self.component_config.get("db_path")  # Retrieve db_path from config

        if not self._api_key:
            rasa.shared.utils.io.raise_warning(
                "GeminiEntityExtractor: 'api_key' is not configured. "
                "Ensure the Gemini API can be accessed by providing an API key."
            )

        try:
            genai.configure(api_key=self._api_key)
            self.model = genai.GenerativeModel(self._model_name)
        except Exception as e:
            logger.error(f"GeminiEntityExtractor: Error configuring Gemini API: {e}")
            self.model = None

    @classmethod
    def create(
        cls,
        config: Dict[Text, Any],
        model_storage: ModelStorage,
        resource: Resource,
        execution_context: ExecutionContext,
    ) -> GeminiEntityExtractor:
        """Creates component (see parent class for full docstring)."""
        return cls(config)

    def _get_gemini_response_json(self, text: Text) -> Optional[Dict[Text, Any]]:
        """Sends the text to the Gemini API and attempts to parse the JSON response."""
        if self.model is None:
            logger.warning("Gemini API client not initialized. Ensure API key is provided.")
            return None

        prompt_text = text

        try:
            response = self.model.generate_content([prompt_text])
            response.resolve()  # Ensure the response is fully available

            if response.text:
                try:
                    clean_text = response.text.replace('```json', '') \
                                          .replace('```', '') \
                                          .strip()
                    return json.loads(clean_text)
                except json.JSONDecodeError:
                    logger.error(
                        f"GeminiEntityExtractor: Failed to decode JSON response: {response.text},{clean_text}"
                    )
                    return None
            else:
                logger.warning(
                    f"GeminiEntityExtractor: Empty response from Gemini API."
                )
                return None

        except Exception as e:
            logger.error(f"GeminiEntityExtractor: Error calling Gemini API: {e}")
            return None

    def process(self, messages: List[Message]) -> List[Message]:
        """Augments the message with potentially extracted entities based on filters."""
        if self.model is None:
            return messages

        filter_data = [
                        {"type": "PROPERTY_TYPE", "options": ["Residential Apartment", "Independent House/Villa", "Residential Land", "Independent/Builder Floor", "Farm House", "Serviced Apartments", "Studio Apartment", "Other"], "desc": "Type of property (e.g., Apartment, Villa, Land)"},
                        {"type": "BEDROOM_NUM", "options": ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "6 BHK", "7 BHK", "8 BHK", "9 BHK", "9+ BHK"], "desc": "Number of bedrooms (e.g., 2 BHK, 3 BHK)"},
                        {"type": "BATHROOM_NUM", "options": ["1+", "2+", "3+", "4+", "5+"], "desc": "Minimum number of bathrooms (e.g., 2+, 3+)"},
                        {"type": "BUDGET", "options": {"MIN_PRICE": 0, "MAX_PRICE": 99999999}, "desc": "Price range (e.g., ₹50L – ₹2Cr)"},
                        {"type": "AREA_SQFT", "options": {"MIN_AREA_SQFT": 0, "MAX_AREA_SQFT": 4000}, "desc": "Size of property in sq. ft. (e.g., 1000 – 2000 sq. ft.)"},
                        {"type": "TRANSACT_TYPE", "options": [1, 2], "desc": "Transaction type (1 = Sale, 2 = Rent)"},
                        {"type": "CITY", "options": ["Secunderabad", "Hyderabad", "Kolkata South", "Kolkata North", "Kolkata Central", "Kolkata East", "Kolkata West", "Mumbai Beyond Thane", "Navi Mumbai", "Thane", "Mumbai Harbour", "South Mumbai", "Central Mumbai suburbs", "Mumbai South West", "Mumbai Andheri-Dahisar", "Mira Road And Beyond", "Gurgaon"], "desc": "List of Locations"},
                        {"type": "AMENITIES", "options": ["Swimming Pool", "Power Back-up", "Club house / Community Center", "Feng Shui / Vaastu Compliant", "Park", "Private Garden / Terrace", "Security Personnel", "Centrally Air Conditioned", "ATM", "Fitness Centre / GYM", "Cafeteria / Food Court", "Bar / Lounge", "Conference room", "Security / Fire Alarm", "Visitor Parking", "Intercom Facility", "Lift(s)", "Service / Goods Lift", "Maintenance Staff", "Water Storage", "Waste Disposal", "Rain Water Harvesting", "Access to High Speed Internet", "Bank Attached Property", "Piped-gas", "Water purifier", "Shopping Centre", "WheelChair Accessibility", "DG Availability", "CCTV Surveillance", "Grade A Building", "Grocery Shop", "Near Bank"], "desc": "Available facilities (e.g., Gym, Pool, Lift)"},
                    ]

        valid_filter_types = {f["type"] for f in filter_data}

        for message in messages:
            sender_id = message.get("metadata", {}).get("sender")
            text = message.get(TEXT)
            if not text:
                continue

            query = f"""SELECT *
                            FROM saved_preferences
                            WHERE sender_id = '{sender_id}'
                            AND action_name = 'final_text_filters'
                            ORDER BY timestamp DESC
                            LIMIT 1; """

            saved_final_text_filters = GetDataFromDB(query, self._db_path)

            prompt = (
               f""" You task is to analyze this user's message: "{text}".

                    Use this filter schema:
                    {json.dumps(filter_data, indent=2)}

                    Current filters:
                    {saved_final_text_filters}

                    Critical Instructions:
                    1. Contextual Mapping:
                    - Map user terms to CLOSEST schema match when:
                        - Synonym exists (cottage → villa)
                        - Abbreviation matches (3BHK → 3 BHK)
                        - Category implied (luxury → premium segment in pricing)

                    2. Confidence Threshold:
                    - Add filter ONLY if >90% confident it matches schema intent
                    - Reject if:
                        - Multiple interpretations exist
                        - No direct/indirect schema counterpart

                    3. Numerical Inference:
                    - "Around X" → 10% buffer range (around 50L → 45L-55L)
                    - "Mid-range" → Use schema's predefined mid-tier values
                    - "Over/under" → Set min/max with 5% buffer

                    4. Negation Logic:
                    - "No studios" → Remove studio apartment type
                    - "Avoid X" → Remove if X maps to schema value
                    - Ignore non-mappable negations ("no bad areas")

                    5. Ignore Ambiguity:
                    - Vague terms (e.g., "nice", "spacious", "cheap", "modern") → NO FILTER.
                    - Subjective phrases (e.g., "near park", "good area") → Ignore unless mapped in schema.

                    6. Partial Match Handling:
                    - Match root words: "gym" → "Gymnasium"
                    - Ignore non-essential modifiers: "big pool" → "Swimming Pool"
                    - Normalize formats: "3BHK" → "3 BHK"

                    MAP to schema using:
                    - Bedrooms: "BHK/bedroom" → BEDROOM_NUM
                    - Property: "flat/villa/studio" → PROPERTY_TYPE
                    - Budget: "under 50L" → {{"max":5000000}}
                    - Bathrooms: "3 baths" → BATHROOM_NUM:["3"]

                    CONVERT values:
                    - "50L" → 5000000, "3BHK" → "3 BHK", "studio" → "Studio Apartment"

                     UPDATE FILTERS:
                    - "add_text_filters": filters the user IS REQUESTING (e.g., mentions needing, wants, includes)
                    - "remove_text_filters": filters the user IS EXCLUDING (e.g., "no X", "exclude Y", "don't want Z", "remove Z")
                    - "final_text_filters": updated current filters after REQUESTING or EXCLUDING
                    - MERGE with existing filters (don't reset unmentioned)
                    - FINAL_FILTERS = (Current - Removed) + Added

                    Each filter entry should have:
                    - "type": exact filter type from schema - key
                    - "value": filter that matches the keyword in message (flat, 2 BHK, Ac rooms) - list of options for a filters
                    - You can insert multiple values in the list for the filter if user have mentioned multiple options for a filter
                    
                    # **you must not explain the issue with data, just return blank json if don't find any value or you are certain about**
                    
                    Example response for "3BHK flats under 50L but no studios":
                    This format will be returned:
                    {{

                    "add_text_filters": [
                        {{"type": "BEDROOM_NUM", "value": ["3 BHK"]}},
                        {{"type": "BUDGET", "value": {{"max": 5000000}}}}
                    ],

                    "remove_text_filters": [
                        {{"type": "PROPERTY_TYPE", "value": ["Studio Apartment"]}}
                    ],

                    # based on the user's request update/remove filters. Include ALL existing filters that should remain, or remove that needs to be .

                    "final_text_filters": [
                        {{"type": "PROPERTY_TYPE", "value": ["Independent House/Villa"]}},
                        {{"type": "BUDGET", "value": {{"min": 5000000, "max": 10000000}}}},
                        {{"type": "BEDROOM_NUM", "value": ["3 BHK","4 BHK","5 BHK",]}},
                        {{"type": "BATHROOM_NUM", "value": ["3+", "5+"]}},
                    ]

                    }}

                    Response:"""
            )

            if response_json := self._get_gemini_response_json(prompt):
                print("RESPONSE:-2",type(response_json))
                print("RESPONSE:-1",response_json.get("final_text_filters"))

                updated_final_text_filters = response_json.get("final_text_filters", [])



                # Validate all filters before saving
                # valid_filters = []
                # for filt in final_text_filters:
                #     if self._is_valid_filter(filt, valid_filter_types):
                #         valid_filters.append(filt)
                #     else:
                #         logger.warning(f"Invalid filter removed: {filt}")

                # Save to database
                metadata = message.get("metadata", {})
                model_id = metadata.get("model_id", "unknown_model")
                assistant_id = metadata.get("assistant_id", "unknown_assistant")
                current_timestamp = time.time()

                data_value = {
                    "event": "slot",
                    "timestamp": current_timestamp,
                    "metadata": {
                        "model_id": model_id,
                        "assistant_id": assistant_id
                    },
                    "name": "final_text_filters",
                    "value":  updated_final_text_filters,
                    "filled_by": "GeminiEntityExtractor"
                }

                data_json = json.dumps(data_value)

                conn = None
                try:
                    conn = sqlite3.connect(self._db_path)
                    cursor = conn.cursor()
                    insert_query = """
                            INSERT INTO saved_preferences (sender_id, type_name, timestamp, action_name, data)
                            VALUES (?, ?, ?, ?, ?)
                        """
                        #  ON CONFLICT(sender_id, type_name)
                        #     DO UPDATE SET
                        #         timestamp = excluded.timestamp,
                        #         action_name = excluded.action_name,
                        #         data = excluded.data;

                    cursor.execute(insert_query, (
                        sender_id,
                        'slot',
                        current_timestamp,
                        'final_text_filters',
                        data_json
                    ))
                    conn.commit()
                except Exception as e:
                    logger.error(f"Error saving final_text_filters to database: {e}")
                finally:
                    if conn:
                        conn.close()

                # # Append the final_text_filters as a single entity entry
                # entities = [
                #     {
                #         "entity": "final_text_filters",
                #         "value": final_text_filters,
                #         "confidence": 1.0,
                #         "extractor": self.__class__.__name__
                #     }
                # ]

                # message.set(ENTITIES, message.get(ENTITIES, []) + entities, add_to_output=True)

                print("RESPONSE:0", sender_id, saved_final_text_filters)
                print("RESPONSE:1", response_json)
                print("RESPONSE:1 response", updated_final_text_filters)
                print("RESPONSE:3", data_json)
                # print("RESPONSE:3", prompt)

        return messages

    # def _is_valid_filter(self, filt: Dict, valid_types: set) -> bool:
    #     if "type" not in filt:
    #         logger.warning("Filter missing 'type' key")
    #         return False

    #     if filt["type"] not in valid_types:
    #         logger.warning(f"Invalid filter type: {filt['type']}")
    #         return False

    #     if "value" not in filt:
    #         logger.warning(f"Filter missing 'value' key for type: {filt['type']}")
    #         return False

    #     if not isinstance(filt["value"], (list, dict)):
    #         logger.warning(f"Filter value must be a list or dict for type: {filt['type']}")
    #         return False

    #     if not filt["value"]:
    #         logger.warning(f"Empty value list for filter type: {filt['type']}")
    #         return False

    #     return True

    def train(self, training_data: TrainingData) -> Resource:
        """No training is needed for this component as it uses a pre-trained model."""
        return self._resource

    def persist(self) -> None:
        """No persistence is needed for this component as it uses an external API."""
        pass

    @classmethod
    def load(
        cls,
        config: Dict[Text, Any],
        model_storage: ModelStorage,
        resource: Resource,
        execution_context: ExecutionContext,
        **kwargs: Any,
    ) -> GeminiEntityExtractor:
        """Loads trained component (see parent class for full docstring)."""
        return cls(config)