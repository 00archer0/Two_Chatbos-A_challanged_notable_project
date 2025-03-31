from typing import Any, Dict, List, Text
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, Restarted
import os
from twilio.rest import Client
import traceback

import re
import google.generativeai as genai
import requests
import json  # Import json here
import logging
logger = logging.getLogger(__name__)

import sqlite3
from pathlib import Path
import pandas as pd
# Define the SQLite database path
db_path = "/workspaces/Rasa_challenge/rasa.db"

# Twilio Credentials from Environment Variables
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")
DESTINATION_PHONE_NUMBER = os.environ.get("DESTINATION_PHONE_NUMBER")
TWILIO_URL = os.environ.get("TWILIO_URL")

# Existing actions (modified for naming consistency)
# -------------------------------------------------

import logging
import math

import math
import logging

def format_properties(data):
    properties = []
    for i, item in enumerate(data, start=101):
        try:
            # Safer handling of NaN and None values
            bedroom_val = item.get("BEDROOM_NUM", 0)
            bedrooms = int(bedroom_val) if bedroom_val is not None and not (isinstance(bedroom_val, float) and math.isnan(bedroom_val)) else 0
            
            bathroom_val = item.get("BATHROOM_NUM", 0)
            bathrooms = int(bathroom_val) if bathroom_val is not None and not (isinstance(bathroom_val, float) and math.isnan(bathroom_val)) else 0
            
            area_val = item.get("BUILTUP_SQFT", 0)
            area = f"{int(area_val)} sq ft" if area_val is not None and not (isinstance(area_val, float) and math.isnan(area_val)) else "Area not specified"
            
            # Get locality with fallback
            locality = item.get("LOCALITY")
            location_text = locality if locality else "an unspecified location"
            
            formatted = {
                "id": item.get("PROP_ID", f"unknown-{i}"),
                "title": item.get("PROP_HEADING", "Unnamed Property"),
                "price": item.get("PRICE", "Price not specified"),
                "address": item.get("CITY") or "Location not specified",
                "type": item.get("PROPERTY_TYPE", "Not specified"),
                "image": item.get("PHOTO_URL") or "/default-image.jpg",
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "area": area,
                "yearBuilt": None,  
                "description": f"{item.get('PROP_HEADING', 'Property')} located in {location_text} with {bedrooms} bedrooms and {bathrooms} bathrooms.",
                "amenities": [
                    "Parking", "Security", "Balcony"
                ],
                "images": [
                    item.get("PHOTO_URL") or "/default-image.jpg", 
                    item.get("PHOTO_URL") or "/default-image.jpg"
                ],
                "agent": {
                    "name": "Jessica Parker",
                    "title": "Senior Real Estate Agent",
                    "phone": "(555) 123-4567",
                    "email": "jessica@realestate.com",
                    "avatar": "/api/placeholder/60/60"
                }
            }
            properties.append(formatted)
        except Exception as e:
            logging.error(f"Error processing property {item.get('PROP_ID', 'unknown')}: {str(e)}")
            # Still continue to next item
    
    return {"properties": properties}



def GetDataFromDB(query):
    
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    table_name = 'prop_data'  # Change to the table you want to read
    
    df = pd.read_sql_query(query, conn)
    data = df.to_dict(orient="records")
    
    conn.close()
    
    return data

def GetFiltersFromDB(sender_id):
    
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get the most recent filter entry
    cursor.execute('''
            SELECT data 
            FROM saved_preferences 
            WHERE sender_id = ? 
                AND action_name = 'final_text_filters' 
                AND type_name = 'slot'
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (sender_id,))
        
    filter_event = cursor.fetchone()
    try:
        event_data = json.loads(filter_event[0])
        filters = event_data.get('value', [])
        print("filter_event",filters)
        return filters
    except:
        return []
    
def LLMConnection(prompt):
    api_url = "https://api.mistral.ai/v1/chat/completions"  # Removed comma
    api_key = os.environ.get("GEMINI_API_KEY")  # Removed comma
    model_name = "gemini-2.0-flash"  # Removed comma and corrected model name ("ministral" was misspelled)
    timeout = 10  # Removed comma
    
    if not api_key:  # Changed to check api_key instead of api_url
        print("err")
        return None
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
    except Exception as e:
        logger.error(f"GeminiINaction: Error configuring Gemini API: {e}")
        model = None
    
    try:
            response = model.generate_content([prompt])
            response.resolve()  # Ensure the response is fully available

            if response.text:
                try:
                    clean_text = response.text.replace('```html', '') \
                                          .replace('```', '') \
                                          .strip()
                    return clean_text
                except json.JSONDecodeError:
                    logger.error(
                        f"GeminiINaction: Failed to decode JSON response: {response.text},{clean_text}"
                    )
                    return None
            else:
                logger.warning(
                    f"GeminiINaction: Empty response from Gemini API."
                )
                return None

    except Exception as e:
            logger.error(f"GeminiINaction: Error calling Gemini API: {e}")
            return None
   
def QueryLLMConnection(tracker):
    
    
    # tracker.current_slot_values()
    # tracker.latest_message['text']
    
    
    text = """message.get(TEXT)
            if not text:
                continue"""

            # Updated prompt for new filter format
    prompt = (
               f""" Analyze this user's query: "{text}". Use this filter schema:
                    """
            )

    if response := LLMConnection(prompt):
                print("RESPONSE:",response)
                print(tracker.current_slot_values() # slots are not filled yet
                      ,tracker.latest_message['text'])
    
    return response

def CustomSlotSet(tracker):
        latest_user_event = None
        slot_sets = []
        for event in reversed(tracker.events):
            if event.get('event') == 'user':
                latest_user_event = event
                break

        if latest_user_event:
            # Extract MistralEntityExtractor entities
            # Process entities
            
            for entity in latest_user_event.get('parse_data', {}).get('entities', []):
                if entity.get('extractor') == 'MistralEntityExtractor':
                    slot_sets.append(SlotSet(entity['entity'], entity['value']))
            
            # Process commands
            for cmd in latest_user_event.get('parse_data', {}).get('commands', []):
                if cmd.get('command') == 'set slot':
                    slot_sets.append(SlotSet(cmd['name'], cmd['value']))
            
            print("\n'set slot' commands:", slot_sets)
        else:
            print("No user event found in the data")
        
        print("TRACKER:")
        
        return slot_sets
    
def GetPropertyData(filters):
    conditions = []
    for filter_item in filters:
        
        col_type = filter_item['type']
        values = filter_item.get('value', [])
        if not values:
            continue
        
        processed_values = []
        for v in values:
            try:
                if col_type == "BEDROOM_NUM":
                    num = int(v.split()[0])
                    processed_values.append(str(num))
                elif col_type == "BATHROOM_NUM":
                    num = int(v.replace('+', ''))
                    processed_values.append(str(num))
                else:
                    escaped = str(v).replace("'", "''")
                    processed_values.append(f"'{escaped}'")
            except (ValueError, IndexError, AttributeError):
                continue
        
        if not processed_values:
            continue
        
        if col_type in ["BEDROOM_NUM", "BATHROOM_NUM"]:
            in_clause = f"{col_type} IN ({', '.join(processed_values)})"
        else:
            in_clause = f"{col_type} IN ({', '.join(processed_values)})"
        conditions.append(in_clause)
    
    # Add conditions to exclude None values and "Price on Request"
    exclude_none_conditions = [
        "PHOTO_URL IS NOT NULL",
        "PROP_HEADING IS NOT NULL",
        "BEDROOM_NUM IS NOT NULL",
        "BATHROOM_NUM IS NOT NULL",
        "PROPERTY_TYPE IS NOT NULL",
        "LOCALITY IS NOT NULL",
        "BUILTUP_SQFT IS NOT NULL",
        "PRICE != 'Price on Request'"
    ]
    
    if not conditions:
        where_clause = " AND ".join(exclude_none_conditions)
    else:

        where_clause = " OR ".join(conditions) + " AND " + " AND ".join(exclude_none_conditions)

    
    if not where_clause:
        return ""
    
    return f"SELECT PRICE, PHOTO_URL, PROP_HEADING, BEDROOM_NUM, BATHROOM_NUM, PROPERTY_TYPE, CITY, BUILTUP_SQFT, PROP_ID FROM prop_data WHERE {where_clause} LIMIT 5;"

class ActionSearchProperties(Action):
    def name(self) -> Text:
        return "action_search_properties"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        try:
            filters = GetFiltersFromDB(tracker.sender_id)
            query = GetPropertyData(filters)
            data = GetDataFromDB(query)

            data = format_properties(data)

            if not data:
                dispatcher.utter_message("I'm sorry, I couldn't find any properties matching your exact criteria. Would you like to try a modifying search?")
                dispatcher.utter_message("P.S., Currenty i support these few locations Secunderabad, Hyderabad, Kolkata, Navi Mumbai, Thane, Mumbai, Gurgaon?")
                return []

            dispatcher.utter_message("Here are your search results:", json_message=data)
            return []

        except Exception as e:
            error_details = traceback.format_exc()
            logger.error(f"Error in ActionSearchProperties: {e}\n{error_details}")
            dispatcher.utter_message("An error occurred while searching for properties. Please try again by rephrasing or modifying the filters.")
            return []

class ActionFetchPropertyDetails(Action):
    def name(self) -> Text:
        return "action_fetch_property_details"
        
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Get potential property IDs from message and slot
        last_message = tracker.latest_message.get('text', '')
        slot_value = tracker.get_slot("property_id")
        property_ids = self.extract_property_ids(last_message) or slot_value
        
        if not property_ids:
            dispatcher.utter_message("Please provide a property ID to retrieve the details.")
            return []
            
        return self.process_property_ids(property_ids, dispatcher, last_message)
    
    def extract_property_ids(self, text):
        """Extract property IDs from text using simple number patterns."""
        if not text:
            return None
            
        # Find all sequences of digits in the text
        try:
            ids = re.findall(r'"([^"]+)"', text.split('[')[1].split(']')[0])
        except:
            ids = None
        
        return ids if ids else None
    
    def process_property_ids(self, property_ids, dispatcher, last_message):
        """Process the property IDs by querying the database."""
        try:
            formatted_ids = ", ".join(f"'{id_}'" for id_ in property_ids)
            query = f"""
                SELECT *
                FROM prop_data 
                WHERE PROP_ID IN ({formatted_ids})
                """
            
            data = GetDataFromDB(query)
            if not data:
                dispatcher.utter_message(f"I couldn't find any properties with ID(s): {', '.join(property_ids)}")
                return []
                
            prompt = f""" your taks is to answer a **friendly and engaging direct response**, because this query is in between of a conversation. 
#### **Input:** - **User's Query:** `{last_message}`  
- **Property Details:** `{data}`  

#### **Instructions:**
1. Answer the user's query with the property details in a conversational style.  
2. Highlight important features (e.g., price, amenities, location benefits).  
3. Mention nearby landmarks for better context.  
4. In points, if needed 
5. No propmted questions in the end
6. don't use h1,h2

            
            Important:
            Response must be formated by HTML and enclosed in <div class="LLMformated"> only
"""

            response = LLMConnection(prompt)
            dispatcher.utter_message(str(response))
            
            # Update slot with the processed IDs
            return [SlotSet("property_id", property_ids)]
            
        except Exception as e:
            dispatcher.utter_message(f"Error fetching property details: {str(e)}")
            return []

class ActionCompareProperties(Action):
    def name(self) -> Text:
        return "action_compare_properties"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Get property IDs from both message and slot
        last_message = tracker.latest_message.get('text', '')
        slot_value = tracker.get_slot("property_id_list")
        property_ids = self.extract_property_ids(last_message) or slot_value

        if not property_ids:
            dispatcher.utter_message("Please provide property IDs to compare (e.g., [\"ID1\", \"ID2\"]).")
            return []
            
        return self.process_property_comparison(property_ids, dispatcher, last_message)

    def extract_property_ids(self, text: Text) -> List[Text]:
        """Extract property IDs from text using bracket-quoted format."""
        if not text:
            return None
        try:
            # Extract quoted IDs within square brackets
            ids = re.findall(r'"([^"]+)"', text.split('[')[1].split(']')[0])
        except Exception:
            ids = None
        return ids if ids else None

    def process_property_comparison(self, property_ids: List[Text], 
                                  dispatcher: CollectingDispatcher,
                                  last_message: Text) -> List[Dict[Text, Any]]:
        """Execute comparison logic and generate response."""
        try:
            # Query database for all properties
            formatted_ids = ", ".join([f"'{pid}'" for pid in property_ids])
            query = f"SELECT * FROM prop_data WHERE PROP_ID IN ({formatted_ids})"
            properties_data = GetDataFromDB(query)

            if not properties_data:
                dispatcher.utter_message(f"I couldn't find any properties with IDs: {', '.join(property_ids)}")
                return []

            # Generate comparison using LLM
            prompt = f"""Your task is to create a **detailed yet friendly comparison** between properties:
            
            **User Request**: {last_message}
            **Property Data**: {properties_data}

            Guidelines:
            1. Compare key aspects: price/sqft, amenities, location, and unique features
            2. Use emojis where appropriate for visual appeal 🌟
            3. Highlight clear differentiators in bullet points
            4. Maintain neutral tone but mention clear advantages
            5. Conclude with a helpful summary statement
            6. don't use h1,h2
            
            Important:
            Response must be formated by HTML and enclosed in <div class="LLMformated"> only
            """
            
            
            llm_response = LLMConnection(prompt)
            dispatcher.utter_message(str(llm_response))

            # Update conversation context
            return [SlotSet("property_id_list", property_ids),
                    SlotSet("last_comparison", properties_data)]

        except Exception as e:
            logger.error(f"Comparison error: {str(e)}")
            dispatcher.utter_message("Hmm, I'm having trouble comparing those properties. Let's try again!")
            return []
  
class ActionShowSavedProperties(Action):
    def name(self) -> Text:
        return "action_show_saved_properties"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sender_id = tracker.sender_id
        
        try:
            # Query the database to get the saved properties based on sender_id (session_id)
            query = f"""
                SELECT p.* FROM prop_data p
                JOIN favorites f ON p.PROP_ID = f.property_id
                WHERE f.session_id = '{sender_id}'
            """
            
            saved_properties = GetDataFromDB(query)

            if not saved_properties:
                dispatcher.utter_message("You don't have any saved properties yet.")
                return []
            
            # Format the saved properties for display
            formatted_properties = format_properties(saved_properties)
            
            # Display the saved properties
            dispatcher.utter_message("Here are your saved properties:", json_message=formatted_properties)

            return []
        
        except Exception as e:
            dispatcher.utter_message(f"Error retrieving saved properties: {str(e)}")
            return []

class ActionScheduleViewing(Action):
    def name(self) -> Text:
        return "action_schedule_viewing"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Get all slot values
        sender_id = tracker.sender_id
        property_id = tracker.get_slot("property_id")
        property_address = tracker.get_slot("property_address")
        visit_date = tracker.get_slot("schedule_viewing_date")
        visit_time = tracker.get_slot("schedule_viewing_time")
        
        # Check if required slots are filled
        if not visit_date or not visit_time:
            dispatcher.utter_message("Sorry, I need both date and time to schedule a viewing.")
            return []
        
        call_status = "not initiated"
        
        # Try to initiate Twilio call if credentials are available
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER and DESTINATION_PHONE_NUMBER:
            try:
                # Twilio call initiation
                client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                call = client.calls.create(
                    from_=TWILIO_PHONE_NUMBER,
                    to=DESTINATION_PHONE_NUMBER,
                    url=TWILIO_URL, #ensure this ngrok url is active, and the webhooks are handled correctly.
                )
                print(f"Twilio Call SID: {call.sid}")
                call_status = "call initiated"
                dispatcher.utter_message(f"Scheduling viewing for {visit_date} at {visit_time} and initiating a call to confirm.")
                
            except Exception as e:
                print(f"Error initiating Twilio call: {e}")
                dispatcher.utter_message(f"Scheduling viewing for {visit_date} at {visit_time}, but there was an error initiating the call. Please check your Twilio credentials, ngrok setup, and environment variables.")
                call_status = "error initiating call"
        else:
            dispatcher.utter_message("Twilio credentials are not set in the environment variables.")
            call_status = "missing credentials"
        
        # Save scheduling details to database
        try:
            # Connect to the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if scheduled_visits table exists, create if not
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id TEXT,
                property_id TEXT,
                property_address TEXT,
                visit_date TEXT,
                visit_time TEXT,
                confirmation TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Insert the scheduled visit
            cursor.execute('''
            INSERT INTO scheduled_visits (
                sender_id, property_id, property_address, 
                visit_date, visit_time, confirmation, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                sender_id, property_id, property_address,
                visit_date, visit_time, call_status, 'active'
            ))
            
            # Commit and close
            conn.commit()
            conn.close()
            
            logger.info(f"Successfully saved scheduling details for property {property_id}")
            
            # Only send this message if it wasn't already sent during Twilio call handling
            if call_status != "call initiated":
                dispatcher.utter_message(f"Visit scheduled successfully for {visit_date} at {visit_time}.")
            
        except Exception as e:
            logger.error(f"Error saving scheduling details to database: {str(e)}")
            dispatcher.utter_message("There was an error saving your scheduled visit. Please try again.")
        
        return []

class ActionCheckScheduledVisits(Action):
    def name(self) -> Text:
        return "action_check_scheduled_visits"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sender_id = tracker.sender_id
        
        try:
            # Connect to the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Query for active scheduled visits
            cursor.execute('''
            SELECT id, property_id, property_address, visit_date, visit_time, status
            FROM scheduled_visits
            WHERE sender_id = ? AND status = 'active'
            ORDER BY visit_date, visit_time
            ''', (sender_id,))
            
            visits = cursor.fetchall()
            conn.close()
            
            if not visits:
                dispatcher.utter_message("You don't have any scheduled visits at the moment.")
                return []
            
            # Format the response
            visit_list = []
            for visit in visits:
                visit_id, prop_id, address, date, time, status = visit
                visit_list.append({
                    "visit_id": visit_id,
                    "property_id": prop_id,
                    "address": address,
                    "date": date,
                    "time": time,
                    "status": status
                })
            
            # Create a formatted message
            message = "Here are your scheduled visits:\n\n"
            for idx, visit in enumerate(visit_list, 1):
                message += f"{idx}. Property ID: {visit['property_id']}\n"
                message += f"   Address: {visit['address']}\n"
                message += f"   Date: {visit['date']} at {visit['time']}\n"
                message += f"   Visit ID: {visit['visit_id']}\n\n"
            
            message += "To reschedule or cancel a visit, please use the visit ID."
            
            dispatcher.utter_message(message)
            
            # Set a slot with the list of visits for future reference
            return [SlotSet("scheduled_visits", visit_list)]
            
        except Exception as e:
            logger.error(f"Error checking scheduled visits: {str(e)}")
            dispatcher.utter_message("There was an error retrieving your scheduled visits. Please try again.")
            return []

class ActionCancelVisit(Action):
    def name(self) -> Text:
        return "action_cancel_visit"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sender_id = tracker.sender_id
        visit_id = tracker.get_slot("visit_id")
        
        if not visit_id:
            dispatcher.utter_message("To cancel a visit, I need the visit ID. Please provide the visit ID.")
            return []
        
        try:
            # Connect to the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if the visit exists and belongs to the user
            cursor.execute('''
            SELECT id, property_id, property_address FROM scheduled_visits
            WHERE id = ? AND sender_id = ? AND status = 'active'
            ''', (visit_id, sender_id))
            
            visit = cursor.fetchone()
            
            if not visit:
                dispatcher.utter_message(f"Visit with ID {visit_id} not found or already cancelled.")
                conn.close()
                return []
            
            # Update the status to cancelled
            cursor.execute('''
            UPDATE scheduled_visits
            SET status = 'cancelled'
            WHERE id = ?
            ''', (visit_id,))
            
            conn.commit()
            conn.close()
            
            # Get property details from the visit
            property_id = visit[1]
            property_address = visit[2]
            
            dispatcher.utter_message(f"Visit for property {property_id} at {property_address} has been cancelled.")
            
            return [SlotSet("visit_id", None)]
            
        except Exception as e:
            logger.error(f"Error cancelling visit: {str(e)}")
            dispatcher.utter_message("There was an error cancelling your visit. Please try again.")
            return []

class ActionRescheduleVisit(Action):
    def name(self) -> Text:
        return "action_reschedule_visit"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sender_id = tracker.sender_id
        visit_id = tracker.get_slot("visit_id")
        new_date = tracker.get_slot("new_schedule_date")
        new_time = tracker.get_slot("new_schedule_time")
        
        if not visit_id or not new_date or not new_time:
            dispatcher.utter_message("To reschedule a visit, I need the visit ID, new date, and new time.")
            return []
        
        try:
            # Connect to the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if the visit exists and belongs to the user
            cursor.execute('''
            SELECT id, property_id, property_address FROM scheduled_visits
            WHERE id = ? AND sender_id = ? AND status = 'active'
            ''', (visit_id, sender_id))
            
            visit = cursor.fetchone()
            
            if not visit:
                dispatcher.utter_message(f"Visit with ID {visit_id} not found or not active.")
                conn.close()
                return []
            
            # Update the visit with new date and time
            cursor.execute('''
            UPDATE scheduled_visits
            SET visit_date = ?, visit_time = ?
            WHERE id = ?
            ''', (new_date, new_time, visit_id))
            
            conn.commit()
            conn.close()
            
            # Get property details from the visit
            property_id = visit[1]
            property_address = visit[2]
            
            dispatcher.utter_message(f"Visit for property {property_id} at {property_address} has been rescheduled to {new_date} at {new_time}.")
            
            return [
                SlotSet("visit_id", None),
                SlotSet("new_schedule_date", None),
                SlotSet("new_schedule_time", None)
            ]
            
        except Exception as e:
            logger.error(f"Error rescheduling visit: {str(e)}")
            dispatcher.utter_message("There was an error rescheduling your visit. Please try again.")
            return []


class ActionScheduleViewing(Action):
    def name(self) -> Text:
        return "action_schedule_viewing"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        sender_id = tracker.sender_id
        property_id = tracker.get_slot("property_id")
        property_address = "temp"
        date = tracker.get_slot("schedule_viewing_date")
        time = tracker.get_slot("schedule_viewing_time")
        
        if not property_id or not date or not time:
            dispatcher.utter_message("Sorry, I need the property ID, date, and time to schedule a viewing.")
            return []

        try:
            # Connect to the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if scheduled_visits table exists, create if not
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id TEXT,
                property_id TEXT,
                property_address TEXT,
                visit_date TEXT,
                visit_time TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Insert the scheduled visit
            cursor.execute('''
            INSERT INTO scheduled_visits (
                sender_id, property_id, property_address, 
                visit_date, visit_time, status
            ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                sender_id, property_id, property_address,
                date, time, 'active'
            ))
            
            # Get the ID of the newly inserted visit
            visit_id = cursor.lastrowid
            
            # Commit and close
            conn.commit()
            conn.close()
            
            # Set Twilio call logic here if needed (from original code)
            # ...
            
            dispatcher.utter_message(f"Viewing scheduled for property {property_id} on {date} at {time}. Your visit ID is {visit_id}.")
            
            return [SlotSet("visit_id", visit_id)]
            
        except Exception as e:
            logger.error(f"Error scheduling viewing: {str(e)}")
            dispatcher.utter_message(f"There was an error scheduling your viewing. Please try again.")
            
            return []