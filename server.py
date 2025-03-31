from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import requests
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})

# Database connection
def get_db_connection():
    conn = sqlite3.connect('/workspaces/Rasa_challenge/rasa.db')
    conn.row_factory = sqlite3.Row
    return conn

# Create favorites table if not exists
with get_db_connection() as conn:
    conn.execute('''
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

@app.route('/api/send-message', methods=['POST'])
def send_message():
    data = request.json
    sender_id = data.get('sender_id')
    message = data.get('message')

    try:
        rasa_response = requests.post(
            'http://localhost:5005/webhooks/rest/webhook',
            json={
                'sender': sender_id,
                'message': message,
                'stream': True,
                'input_channel': "web",
                'metadata': {}
            }
        )
        rasa_response.raise_for_status()
        messages = rasa_response.json()
        return jsonify(messages)
    except requests.exceptions.RequestException as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to communicate with Rasa: {e}'}), 500

@app.route('/api/rasa-session', methods=['GET'])
def get_rasa_session():
    try:
        conn = get_db_connection()
        events = conn.execute('''
            SELECT sender_id, timestamp, type_name
            FROM events
            WHERE type_name = 'session_started'
            ORDER BY timestamp DESC
        ''').fetchall()

        session_map = {}
        for event in events:
            if event['sender_id'] not in session_map:
                session_map[event['sender_id']] = dict(event)  # Convert Row to dict

        deduped_sessions = list(session_map.values())[:100]
        return jsonify(deduped_sessions)
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to fetch sessions: {e}'}), 500

@app.route('/api/conversation/<sender_id>', methods=['GET'])
def get_conversation(sender_id):
    try:
        conn = get_db_connection()
        conversation = conn.execute('''
            SELECT data, timestamp
            FROM events
            WHERE sender_id = ?
              AND (type_name = 'bot' OR type_name = 'user')
            ORDER BY timestamp ASC
        ''', (sender_id,)).fetchall()

        messages = [
            {
                'text': json.loads(event['data']).get('text'),
                'data': json.loads(event['data']).get('data'),
                'event': json.loads(event['data']).get('event'),
                'timestamp': event['timestamp']
            }
            for event in conversation
        ]
        return jsonify(messages)
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to fetch conversation: {e}'}), 500

@app.route('/api/sessions/<sender_id>/filters', methods=['GET'])
def get_filters(sender_id):
    try:
        conn = get_db_connection()
        filter_event = conn.execute('''
            SELECT *
            FROM saved_preferences
            WHERE sender_id = ?
              AND action_name = 'final_text_filters'
              AND type_name = 'slot'
            ORDER BY timestamp DESC
            LIMIT 1
        ''', (sender_id,)).fetchone()

        if filter_event and filter_event['data']:
            event_data = json.loads(filter_event['data'])
            filters = event_data.get('value', [])
        else:
            filters = []

        return jsonify({'filters': filters})
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to fetch filters: {e}'}), 500

@app.route('/api/sessions/<sender_id>/filters', methods=['POST'])
def save_filters(sender_id):
    filters = request.json.get('filters')
    try:
        conn = get_db_connection()
        event_data = {
            'event': 'slot',
            'timestamp': int(datetime.now().timestamp()),
            'name': 'final_text_filters',
            'value': filters,
            'filled_by': 'WebInterface',
            'metadata': {
                'model_id': 'web-interface',
                'assistant_id': 'property-bot'
            }
        }

        conn.execute('''
            INSERT INTO events (
                sender_id,
                type_name,
                timestamp,
                data,
                action_name,
                value
            ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            sender_id,
            'slot',
            event_data['timestamp'],
            json.dumps(event_data),
            'final_text_filters',
            json.dumps(filters)
        ))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to save filters: {e}'}), 500

@app.route('/api/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    session_id = data.get('sessionId')
    property_id = data.get('propertyId')
    filters = data.get('filters')

    if not session_id or not property_id or not filters:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO favorites (session_id, property_id, filters, timestamp)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(session_id, property_id) DO UPDATE SET
                filters = excluded.filters,
                timestamp = excluded.timestamp
        ''', (session_id, property_id, filters, int(datetime.now().timestamp())))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to save favorite: {e}'}), 500

@app.route('/api/favorites/<property_id>', methods=['DELETE'])
def remove_favorite(property_id):
    session_id = request.args.get('sessionId')
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400

    try:
        conn = get_db_connection()
        result = conn.execute('''
            DELETE FROM favorites
            WHERE session_id = ? AND property_id = ?
        ''', (session_id, property_id))
        conn.commit()

        if result.rowcount == 0:
            return jsonify({'error': 'Favorite not found'}), 404

        return jsonify({'success': True})
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to remove favorite: {e}'}), 500

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    session_id = request.args.get('sessionId')
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400

    try:
        conn = get_db_connection()
        favorites = conn.execute('''
            SELECT property_id, filters, timestamp
            FROM favorites
            WHERE session_id = ?
            ORDER BY timestamp DESC
        ''', (session_id,)).fetchall()

        formatted = [
            {
                'propertyId': fav['property_id'],
                'filters': fav['filters'],
                'timestamp': fav['timestamp']
            }
            for fav in favorites
        ]
        return jsonify(formatted)
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to fetch favorites: {e}'}), 500

@app.route('/api/favorites/<property_id>', methods=['GET'])
def check_favorite(property_id):
    session_id = request.args.get('sessionId')
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400

    try:
        conn = get_db_connection()
        favorite = conn.execute('''
            SELECT 1
            FROM favorites
            WHERE session_id = ? AND property_id = ?
        ''', (session_id, property_id)).fetchone()

        is_favorite = favorite is not None
        return jsonify({'isFavorite': is_favorite})
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to check favorite status: {e}'}), 500

@app.route('/api/properties/<property_id>', methods=['GET'])
def get_property_details(property_id):
    try:
        conn = get_db_connection()
        property = conn.execute('''
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
        ''', (property_id,)).fetchone()

        if not property:
            return jsonify({'error': 'Property not found'}), 404

        formatted_property = {
            'id': property['PROP_ID'],
            'title': property['PROP_HEADING'],
            'price': property['PRICE'],
            'address': property['LOCALITY'],
            'bedrooms': property['BEDROOM_NUM'],
            'bathrooms': property['BATHROOM_NUM'],
            'area': f"{property['BUILTUP_SQFT']} sqft",
            'type': property['PROPERTY_TYPE'],
            'description': 'No description available',
            'images': [property['PHOTO_URL']] if property['PHOTO_URL'] else ['https://via.placeholder.com/800x600?text=No+Image+Available'],
            'amenities': ['Not specified'],
            'agent': {
                'name': 'Unknown Agent',
                'phone': 'Not available',
                'email': 'no-email@example.com',
                'avatar': 'https://via.placeholder.com/150?text=Agent',
                'title': 'Real Estate Agent'
            }
        }
        return jsonify(formatted_property)
    except Exception as e:
        app.logger.error(f'Error fetching sessions: {e}', exc_info=True)
        return jsonify({'error': f'Failed to fetch property details: {e}'}), 500

if __name__ == '__main__':
    app.run(port=5055, debug=True)
