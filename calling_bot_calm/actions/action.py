from typing import Any, Dict, List, Text
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, Restarted
import os
import requests
import json
import logging
logger = logging.getLogger(__name__)
import sqlite3
from pathlib import Path
import pandas as pd

# Define the SQLite database path
db_path = "/workspaces/Rasa_challenge/rasa.db"


def GetDataFromDB(query):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    table_name = 'prop_data' # Change to the table you want to read
    df = pd.read_sql_query(query, conn)
    data = df.to_dict(orient="records")
    conn.close()
    return data

# Actions for property dealer scheduling bot
# -------------------------------------------------
class ActionSetInitialSlots(Action):
    def name(self) -> Text:
        return "action_set_initial_slots"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Get property details from database
        try:
            # In a real scenario, you would use the actual property ID selected by the master
            
            property_id = "PROP-1234"  # Example property ID
            query = f"SELECT * FROM prop_data WHERE PROP_ID = '{property_id}' LIMIT 1"
            property_data = GetDataFromDB(query)
            
            if property_data and len(property_data) > 0:
                property_info = property_data[0]
                master_name = "Alex Johnson"  # This would come from user profile in a real system
                property_address = property_info.get("LOCALITY", "Unknown Address")
                
                # Get dealer info from database (example query)
                query_dealer = f"SELECT * FROM dealer_data WHERE PROP_ID = '{property_id}' LIMIT 1"
                try:
                    dealer_data = GetDataFromDB(query_dealer)
                    dealer_name = dealer_data[0].get("NAME", "Property Dealer") if dealer_data else "Property Dealer"
                    dealer_phone = dealer_data[0].get("PHONE", "Unknown") if dealer_data else "Unknown"
                except:
                    # Fallback if dealer data table doesn't exist
                    dealer_name = "Sarah Thompson"
                    dealer_phone = "555-987-6543"
                    logger.warning("Failed to retrieve dealer data from database. Using default values.")
            else:
                # Fallback to default values if property not found
                master_name = "Alex Johnson"
                property_address = "123 Maple Street, Springfield"
                dealer_name = "Sarah Thompson"
                dealer_phone = "555-987-6543"
                logger.warning(f"Property with ID {property_id} not found. Using default values.")
                
        except Exception as e:
            # Fallback values in case of database error
            master_name = "Alex Johnson"
            property_id = "PROP-1234"
            property_address = "123 Maple Street, Springfield"
            dealer_name = "Sarah Thompson"
            dealer_phone = "555-987-6543"
            logger.error(f"Error retrieving data from database: {str(e)}. Using default values.")
        
        # Save initial context to slots
        return [
            SlotSet("master_name", master_name),
            SlotSet("property_id", property_id),
            SlotSet("property_address", property_address),
            SlotSet("dealer_name", dealer_name),
            SlotSet("dealer_phone", dealer_phone)
        ]

class ActionSaveSchedulingDetails(Action):
    def name(self) -> Text:
        return "action_save_scheduling_details"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Get slot values
        master_name = tracker.get_slot("master_name")
        property_id = tracker.get_slot("property_id")
        property_address = tracker.get_slot("property_address")
        dealer_name = tracker.get_slot("dealer_name")
        visit_date = tracker.get_slot("visit_date")
        visit_time = tracker.get_slot("visit_time")
        dealer_alternate_contact = tracker.get_slot("dealer_alternate_contact")
        
        # Save scheduling details to database
        try:
            # Connect to the SQLite database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if scheduled_visits table exists, create if not
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                master_name TEXT,
                property_id TEXT,
                property_address TEXT,
                dealer_name TEXT,
                visit_date TEXT,
                visit_time TEXT,
                dealer_contact TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Insert the scheduled visit
            cursor.execute('''
            INSERT INTO scheduled_visits (
                master_name, property_id, property_address, 
                dealer_name, visit_date, visit_time, dealer_contact
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                master_name, property_id, property_address,
                dealer_name, visit_date, visit_time, dealer_alternate_contact
            ))
            
            # Commit and close
            conn.commit()
            conn.close()
            
            logger.info(f"Successfully saved scheduling details for property {property_id}")
            
        except Exception as e:
            logger.error(f"Error saving scheduling details to database: {str(e)}")
            # Log the details even if database saving fails
            logger.info(f"Scheduling details:")
            logger.info(f"Master: {master_name}")
            logger.info(f"Property: {property_id} at {property_address}")
            logger.info(f"Dealer: {dealer_name}")
            logger.info(f"Visit scheduled for: {visit_date} at {visit_time}")
            logger.info(f"Dealer contact: {dealer_alternate_contact}")
        
        return []

