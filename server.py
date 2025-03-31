import json
import sqlite3
import time
from datetime import datetime
from flask import Flask, request, jsonify
import requests

# Initialize Flask app
app = Flask(__name__)
port = 3333

# Database connection
db_path = '/Users/lalit/Desktop/rasa_env/rasa.db'

def get_db_connection():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

# Initialize database and create tables
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create favorites table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            filters TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            UNIQUE(session_id, property_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print('Connected to SQLite database')

# Rasa Proxy Endpoint
@app.route('/api/send-message', methods=['POST'])
def send_message():
    print('POST /api/send-message - Request:', request.json)
    try:
        data = request.json
        sender_id = data.get('sender_id')
        message = data.get('message')
        
        rasa_payload = {
            'sender': sender_id,
            'message': message,
            'stream': True,
            'input_channel': 'web',
            'metadata': {}
        }
        
        rasa_response = requests.post(
            'http://localhost:5005/webhooks/rest/webhook',
            headers={'Content-Type': 'application/json'},
            json=rasa_payload
        )
        
        if not rasa_response.ok:
            error_message = f"Rasa API error: {rasa_response.reason}"
            print(error_message)
            return jsonify({'error': error_message}), rasa_response.status_code
        
        messages = rasa_response.json()
        print('POST /api/send-message - Response:', messages)
        return jsonify(messages)
        
    except Exception as error:
        print('Error proxying to Rasa:', error)
        error_message = 'Failed to communicate with Rasa'
        print('POST /api/send-message - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Session List Endpoint
@app.route('/api/rasa-session', methods=['GET'])
def get_rasa_sessions():
    print('GET /api/rasa-session - Request')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all session_started events
        cursor.execute('''
            SELECT sender_id, timestamp, type_name
            FROM events
            WHERE type_name = 'session_started'
            ORDER BY timestamp DESC
        ''')
        
        events = cursor.fetchall()
        conn.close()
        
        # Deduplicate in Python - keep only latest entry per sender_id
        session_map = {}
        for event in events:
            event_dict = dict(event)
            if event_dict['sender_id'] not in session_map:
                session_map[event_dict['sender_id']] = event_dict
        
        # Convert dict values to list and limit to 100
        deduped_sessions = list(session_map.values())[:100]
        
        print('GET /api/rasa-session - Response:', deduped_sessions)
        return jsonify(deduped_sessions)
        
    except Exception as error:
        print('Error fetching sessions:', error)
        error_message = 'Failed to fetch sessions'
        print('GET /api/rasa-session - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Conversation History Endpoint
@app.route('/api/conversation/<sender_id>', methods=['GET'])
def get_conversation(sender_id):
    print('GET /api/conversation/:sender_id - Request:', {'sender_id': sender_id})
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT data
            FROM events
            WHERE sender_id = ?
                AND (type_name = 'bot' OR type_name = 'user')
            ORDER BY timestamp ASC
        ''', [sender_id])
        
        conversation = cursor.fetchall()
        conn.close()
        
        messages = []
        for event in conversation:
            data = json.loads(event['data'])
            messages.append({
                'text': data.get('text'),
                'data': data.get('data'),
                'event': data.get('event')
            })
        
        print('GET /api/conversation/:sender_id - Response:', messages)
        return jsonify(messages)
        
    except Exception as error:
        print('Error fetching conversation:', error)
        error_message = 'Failed to fetch conversation'
        print('GET /api/conversation/:sender_id - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Get filters for a session
@app.route('/api/sessions/<sender_id>/filters', methods=['GET'])
def get_session_filters(sender_id):
    print('GET /api/sessions/:sender_id/filters - Request:', {'sender_id': sender_id})
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT *
            FROM saved_preferences
            WHERE sender_id = ?
                AND action_name = 'final_text_filters'
                AND type_name = 'slot'
            ORDER BY timestamp DESC
            LIMIT 1
        ''', [sender_id])
        
        filter_event = cursor.fetchone()
        conn.close()
        
        if filter_event and filter_event['data']:
            # Parse the JSON string from data column
            event_data = json.loads(filter_event['data'])
            
            # Extract the value array from the parsed data
            filters = event_data.get('value', [])
            
            print('GET /api/sessions/:sender_id/filters - Response:', {'filters': filters})
            return jsonify({'filters': filters})
        else:
            print('GET /api/sessions/:sender_id/filters - Response:', {'filters': []})
            return jsonify({'filters': []})
            
    except Exception as error:
        print('Error fetching filters:', error)
        error_message = 'Failed to fetch filters'
        print('GET /api/sessions/:sender_id/filters - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Save filters for a session
@app.route('/api/sessions/<sender_id>/filters', methods=['POST'])
def save_session_filters(sender_id):
    filters = request.json.get('filters')
    print('POST /api/sessions/:sender_id/filters - Request:', {'sender_id': sender_id, 'filters': filters})
    try:
        # Create event object matching your sample structure
        event_data = {
            'event': 'slot',
            'timestamp': time.time(),  # Unix timestamp
            'name': 'final_text_filters',
            'value': filters,
            'filled_by': 'WebInterface',
            'metadata': {
                'model_id': 'web-interface',
                'assistant_id': 'property-bot'
            }
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert into database
        cursor.execute('''
            INSERT INTO events (
                sender_id,
                type_name,
                timestamp,
                data,
                action_name,
                value
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', [
            sender_id,
            'slot',
            event_data['timestamp'],
            json.dumps(event_data),
            'final_text_filters',
            json.dumps(filters)
        ])
        
        conn.commit()
        conn.close()
        
        print('POST /api/sessions/:sender_id/filters - Response:', {'success': True})
        return jsonify({'success': True})
        
    except Exception as error:
        print('Error saving filters:', error)
        error_message = 'Failed to save filters'
        print('POST /api/sessions/:sender_id/filters - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Add a property to favorites
@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    print('POST /api/favorites - Request:', request.json)
    try:
        data = request.json
        session_id = data.get('sessionId')
        property_id = data.get('propertyId')
        filters = data.get('filters')
        
        if not session_id or not property_id or not filters:
            error_message = 'Missing required fields'
            print('POST /api/favorites - Error Response:', {'error': error_message})
            return jsonify({'error': error_message}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Using REPLACE to handle the ON CONFLICT logic in SQLite
        cursor.execute('''
            REPLACE INTO favorites (session_id, property_id, filters, timestamp)
            VALUES (?, ?, ?, ?)
        ''', [session_id, property_id, filters, int(time.time() * 1000)])
        
        conn.commit()
        conn.close()
        
        print('POST /api/favorites - Response:', {'success': True})
        return jsonify({'success': True})
        
    except Exception as error:
        print('Error saving favorite:', error)
        error_message = 'Failed to save favorite'
        print('POST /api/favorites - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Remove a property from favorites
@app.route('/api/favorites/<property_id>', methods=['DELETE'])
def remove_favorite(property_id):
    session_id = request.args.get('sessionId')
    print('DELETE /api/favorites/:propertyId - Request:', {'propertyId': property_id, 'sessionId': session_id})
    try:
        if not session_id:
            error_message = 'Session ID required'
            print('DELETE /api/favorites/:propertyId - Error Response:', {'error': error_message})
            return jsonify({'error': error_message}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'DELETE FROM favorites WHERE session_id = ? AND property_id = ?',
            [session_id, property_id]
        )
        
        if cursor.rowcount == 0:
            error_message = 'Favorite not found'
            print('DELETE /api/favorites/:propertyId - Response:', {'error': error_message})
            conn.close()
            return jsonify({'error': error_message}), 404
        
        conn.commit()
        conn.close()
        
        print('DELETE /api/favorites/:propertyId - Response:', {'success': True})
        return jsonify({'success': True})
        
    except Exception as error:
        print('Error removing favorite:', error)
        error_message = 'Failed to remove favorite'
        print('DELETE /api/favorites/:propertyId - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Get all favorites for a session
@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    session_id = request.args.get('sessionId')
    print('GET /api/favorites - Request:', {'sessionId': session_id})
    try:
        if not session_id:
            error_message = 'Session ID required'
            print('GET /api/favorites - Error Response:', {'error': error_message})
            return jsonify({'error': error_message}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT property_id, filters, timestamp
            FROM favorites
            WHERE session_id = ?
            ORDER BY timestamp DESC
        ''', [session_id])
        
        favorites = cursor.fetchall()
        conn.close()
        
        formatted = []
        for fav in favorites:
            formatted.append({
                'propertyId': fav['property_id'],
                'filters': fav['filters'],
                'timestamp': fav['timestamp']
            })
        
        print('GET /api/favorites - Response:', formatted)
        return jsonify(formatted)
        
    except Exception as error:
        print('Error fetching favorites:', error)
        error_message = 'Failed to fetch favorites'
        print('GET /api/favorites - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Check if a property is favorited
@app.route('/api/favorites/<property_id>', methods=['GET'])
def check_favorite(property_id):
    session_id = request.args.get('sessionId')
    print('GET /api/favorites/:propertyId - Request:', {'propertyId': property_id, 'sessionId': session_id})
    try:
        if not session_id:
            error_message = 'Session ID required'
            print('GET /api/favorites/:propertyId - Error Response:', {'error': error_message})
            return jsonify({'error': error_message}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT 1 FROM favorites WHERE session_id = ? AND property_id = ?',
            [session_id, property_id]
        )
        
        favorite = cursor.fetchone()
        conn.close()
        
        is_favorite = bool(favorite)
        print('GET /api/favorites/:propertyId - Response:', {'isFavorite': is_favorite})
        return jsonify({'isFavorite': is_favorite})
        
    except Exception as error:
        print('Error checking favorite:', error)
        error_message = 'Failed to check favorite status'
        print('GET /api/favorites/:propertyId - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

# Property Details Endpoint (formatted for frontend card)
@app.route('/api/properties/<property_id>', methods=['GET'])
def get_property(property_id):
    print('GET /api/properties/:propertyId - Request:', {'propertyId': property_id})
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                PRICE, 
                PHOTO_URL, 
                PROP_HEADING, 
                BEDROOM_NUM, 
                BATHROOM_NUM, 
                PROPERTY_TYPE, 
                LOCALITY, 
                BUILTUP_SQFT, 
                PROP_ID
            FROM prop_data 
            WHERE PROP_ID = ?
        ''', [property_id])
        
        property_data = cursor.fetchone()
        conn.close()
        
        if not property_data:
            error_message = 'Property not found'
            print('GET /api/properties/:propertyId - Response:', {'error': error_message})
            return jsonify({'error': error_message}), 404
        
        # Format the response according to frontend requirements
        formatted_property = {
            'id': property_data['PROP_ID'],
            'title': property_data['PROP_HEADING'],
            'price': property_data['PRICE'],
            'address': property_data.get('ADDRESS') or property_data['LOCALITY'],
            'bedrooms': property_data['BEDROOM_NUM'],
            'bathrooms': property_data['BATHROOM_NUM'],
            'area': f"{property_data['BUILTUP_SQFT']} sqft",
            'type': property_data['PROPERTY_TYPE'],
            'description': property_data.get('DESCRIPTION') or 'No description available',
            'images': [property_data['PHOTO_URL']] if property_data['PHOTO_URL'] else ['https://via.placeholder.com/800x600?text=No+Image+Available'],
            'amenities': json.loads(property_data['AMENITIES']) if property_data.get('AMENITIES') else ['Not specified'],
            'agent': {
                'name': property_data.get('AGENT_NAME') or 'Unknown Agent',
                'phone': property_data.get('AGENT_PHONE') or 'Not available',
                'email': property_data.get('AGENT_EMAIL') or 'no-email@example.com',
                'avatar': property_data.get('AGENT_AVATAR') or 'https://via.placeholder.com/150?text=Agent',
                'title': property_data.get('AGENT_TITLE') or 'Real Estate Agent'
            }
        }
        
        print('GET /api/properties/:propertyId - Response:', formatted_property)
        return jsonify(formatted_property)
        
    except Exception as error:
        print('Error fetching property:', error)
        error_message = 'Failed to fetch property details'
        print('GET /api/properties/:propertyId - Error Response:', {'error': error_message})
        return jsonify({'error': error_message}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=port, debug=True)