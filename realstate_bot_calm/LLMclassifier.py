from __future__ import annotations

import logging
import os
import json
from typing import Any, Dict, List, Optional, Text, Tuple

import requests
import rasa.shared.utils.io
from rasa.engine.graph import ExecutionContext, GraphComponent
from rasa.engine.recipes.default_recipe import DefaultV1Recipe
from rasa.engine.storage.resource import Resource
from rasa.engine.storage.storage import ModelStorage
from rasa.nlu.classifiers import LABEL_RANKING_LENGTH
from rasa.nlu.classifiers.classifier import IntentClassifier
from rasa.shared.constants import DOCS_URL_TRAINING_DATA_NLU
from rasa.shared.exceptions import RasaException
from rasa.shared.nlu.constants import TEXT
from rasa.shared.nlu.training_data.message import Message
from rasa.shared.nlu.training_data.training_data import TrainingData

logger = logging.getLogger(__name__)

@DefaultV1Recipe.register(
    DefaultV1Recipe.ComponentType.INTENT_CLASSIFIER, is_trainable=True
)
class MistralIntentClassifier(GraphComponent, IntentClassifier):
    """Intent classifier using Mistral's JSON mode API."""

    @staticmethod
    def get_default_config() -> Dict[Text, Any]:
        return {
            "api_url": "https://api.mistral.ai/v1/chat/completions",
            "api_key": os.environ.get("MISTRAL_API_KEY"),
            "model_name": "mistral-large-latest",
            "temperature": 0.3,
            "max_tokens": 200,
            "timeout": 10
        }

    def __init__(
        self,
        config: Dict[Text, Any],
        model_storage: ModelStorage,
        resource: Resource,
        intents: Optional[List[Text]] = None,
    ) -> None:
        self.component_config = config
        self._model_storage = model_storage
        self._resource = resource
        self.intents = intents or []

        if not self.component_config["api_key"]:
            raise RasaException("MISTRAL_API_KEY environment variable required")

    @classmethod
    def create(
        cls,
        config: Dict[Text, Any],
        model_storage: ModelStorage,
        resource: Resource,
        execution_context: ExecutionContext,
    ) -> MistralIntentClassifier:
        return cls(config, model_storage, resource)

    def train(self, training_data: TrainingData) -> Resource:
        labels = [e.get("intent") for e in training_data.intent_examples]
        self.intents = list(set(labels))

        if len(self.intents) < 2:
            rasa.shared.utils.io.raise_warning(
                "Insufficient intents for training. Skipping classifier setup.",
                docs=DOCS_URL_TRAINING_DATA_NLU,
            )
        else:
            self.persist()

        return self._resource

    def process(self, messages: List[Message]) -> List[Message]:
        for message in messages:
            if not self.intents:
                self._set_fallback_intent(message)
                continue

            text = message.get(TEXT)
            if not text:
                self._set_fallback_intent(message)
                continue

            try:
                intent, ranking = self._get_intent_prediction(text)
                message.set("intent", intent, add_to_output=True)
                message.set("intent_ranking", ranking, add_to_output=True)
            except Exception as e:
                logger.error(f"Intent prediction failed: {str(e)}")
                self._set_fallback_intent(message)

        return messages

    def _get_intent_prediction(self, text: Text) -> Tuple[Dict, List[Dict]]:
        prompt = self._create_classification_prompt(text)
        print(f"Prompt to LLM: {prompt}")  # Print the prompt sent to the LLM
        response = self._call_mistral_api(prompt)
        print(f"Response from LLM: {response}")  # Print the response from the LLM

        if not response:
            return {"name": None, "confidence": 0.0}, []

        return self._parse_api_response(response)

    def _create_classification_prompt(self, text: Text) -> Text:
        intents_list = "\n".join([f"- {intent}" for intent in self.intents])
        return f"""Classify this message into one of these intents:
{intents_list}

Message: "{text}"

Respond with JSON format containing:
- "intent": {{"name": "matched_intent", "confidence": 0.95}}
- "ranking": list of {{"name": "intent", "confidence": number}} ordered by confidence

Example:
{{
  "intent": {{"name": "greet", "confidence": 0.95}},
  "ranking": [
    {{"name": "greet", "confidence": 0.95}},
    {{"name": "goodbye", "confidence": 0.05}}
  ]
}}"""

    def _call_mistral_api(self, prompt: Text) -> Optional[Dict]:
        headers = {
            "Authorization": f"Bearer {self.component_config['api_key']}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.component_config["model_name"],
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.component_config["temperature"],
            "max_tokens": self.component_config["max_tokens"],
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(
                self.component_config["api_url"],
                headers=headers,
                json=payload,
                timeout=self.component_config["timeout"]
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Mistral API call failed: {str(e)}")
            return None

    def _parse_api_response(self, response: str) -> Tuple[Dict, List[Dict]]:
        try:
            result = json.loads(response)
            intent = result.get("intent", {})
            ranking = result.get("ranking", [])[:LABEL_RANKING_LENGTH]

            # Validate confidence values
            intent["confidence"] = max(0.0, min(1.0, intent.get("confidence", 0.0)))
            for item in ranking:
                item["confidence"] = max(0.0, min(1.0, item.get("confidence", 0.0)))

            return intent, ranking
        except json.JSONDecodeError:
            logger.error("Failed to parse Mistral API response")
            return {"name": None, "confidence": 0.0}, []

    def _set_fallback_intent(self, message: Message) -> None:
        message.set("intent", {"name": None, "confidence": 0.0}, add_to_output=True)
        message.set("intent_ranking", [], add_to_output=True)

    def persist(self) -> None:
        with self._model_storage.write_to(self._resource) as model_dir:
            intents_file = model_dir / "intents.json"
            rasa.shared.utils.io.dump_obj_as_json_to_file(intents_file, self.intents)

    @classmethod
    def load(
        cls,
        config: Dict[Text, Any],
        model_storage: ModelStorage,
        resource: Resource,
        execution_context: ExecutionContext,
        **kwargs: Any,
    ) -> MistralIntentClassifier:
        try:
            with model_storage.read_from(resource) as model_dir:
                intents_file = model_dir / "intents.json"
                if intents_file.exists():
                    intents = rasa.shared.utils.io.read_json_file(intents_file)
                    return cls(config, model_storage, resource, intents=intents)
        except Exception as e:
            logger.error(f"Error loading classifier: {str(e)}")

        return cls(config, model_storage, resource)
