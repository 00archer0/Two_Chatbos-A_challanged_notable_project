import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

// Initialize Express app
const app = express();
const port = 3333;

// Configure middleware
app.use(express.json());
app.use(cors());

// Database connection
let db;

(async () => {
  try {
    // Open SQLite database
    db = await open({
      filename: '/Users/lalit/Desktop/rasa_env/rasa.db',
      
      driver: sqlite3.Database,
    });

    console.log('Connected to SQLite database');

    // Create favorites table if not exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        filters TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        UNIQUE(session_id, property_id)
      )
    `);

    // Rasa Proxy Endpoint
    app.post('/api/send-message', async (req, res) => {
      console.log('POST /api/send-message - Request:', req.body);
      try {
        const { sender_id, message } = req.body;

        const rasaResponse = await fetch('http://localhost:5005/webhooks/rest/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: sender_id,
            message: message,
            stream: true,
            input_channel: "web",
            metadata: {}
          })
        });

        if (!rasaResponse.ok) {
          const errorMessage = `Rasa API error: ${rasaResponse.statusText}`;
          console.error(errorMessage);
          return res.status(rasaResponse.status).json({ error: errorMessage });
        }

        const messages = await rasaResponse.json();
        console.log('POST /api/send-message - Response:', messages);
        res.json(messages);

      } catch (error) {
        console.error('Error proxying to Rasa:', error);
        const errorMessage = 'Failed to communicate with Rasa';
        console.log('POST /api/send-message - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Session List Endpoint
    app.get('/api/rasa-session', async (req, res) => {
      console.log('GET /api/rasa-session - Request');
      try {
        // Get all session_started events
        const events = await db.all(`
          SELECT sender_id, timestamp, type_name
          FROM events
          WHERE type_name = 'session_started'
          ORDER BY timestamp DESC
        `);

        // Deduplicate in JavaScript - keep only latest entry per sender_id
        const sessionMap = new Map();
        events.forEach(event => {
          if (!sessionMap.has(event.sender_id)) {
            sessionMap.set(event.sender_id, event);
          }
        });

        // Convert Map values to array and limit to 100
        const dedupedSessions = Array.from(sessionMap.values()).slice(0, 100);

        console.log('GET /api/rasa-session - Response:', dedupedSessions);
        res.json(dedupedSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        const errorMessage = 'Failed to fetch sessions';
        console.log('GET /api/rasa-session - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Conversation History Endpoint
    app.get('/api/conversation/:sender_id', async (req, res) => {
      const { sender_id } = req.params;
      console.log('GET /api/conversation/:sender_id - Request:', { sender_id });
      try {
        const conversation = await db.all(`
          SELECT data
          FROM events
          WHERE sender_id = ?
            AND (type_name = 'bot' OR type_name = 'user')
          ORDER BY timestamp ASC
        `, [sender_id]);

        const messages = conversation.map(event => {
          const data = JSON.parse(event.data);
          return {
            text: data.text,
            data: data.data,
            event: data.event
          };
        });

        console.log('GET /api/conversation/:sender_id - Response:', messages);
        res.json(messages);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        const errorMessage = 'Failed to fetch conversation';
        console.log('GET /api/conversation/:sender_id - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Get filters for a session
    app.get('/api/sessions/:sender_id/filters', async (req, res) => {
      const { sender_id } = req.params;
      console.log('GET /api/sessions/:sender_id/filters - Request:', { sender_id });
      try {
        // Get the most recent filter entry
        const filterEvent = await db.get(`
          SELECT *
          FROM saved_preferences
          WHERE sender_id = ?
            AND action_name = 'final_text_filters'
            AND type_name = 'slot'
          ORDER BY timestamp DESC
          LIMIT 1
        `, [sender_id]);

        if (filterEvent && filterEvent.data) {
          // Parse the JSON string from data column
          const eventData = JSON.parse(filterEvent.data);

          // Extract the value array from the parsed data
          const filters = eventData.value || [];

          console.log('GET /api/sessions/:sender_id/filters - Response:', { filters });
          res.json({ filters });
        } else {
          console.log('GET /api/sessions/:sender_id/filters - Response:', { filters: [] });
          res.json({ filters: [] });
        }

      } catch (error) {
        console.error('Error fetching filters:', error);
        const errorMessage = 'Failed to fetch filters';
        console.log('GET /api/sessions/:sender_id/filters - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Save filters for a session
    app.post('/api/sessions/:sender_id/filters', async (req, res) => {
      const { sender_id } = req.params;
      const { filters } = req.body;
      console.log('POST /api/sessions/:sender_id/filters - Request:', { sender_id, filters });
      try {
        // Create event object matching your sample structure
        const eventData = {
          event: "slot",
          timestamp: Date.now() / 1000, // Unix timestamp
          name: "final_text_filters",
          value: filters,
          filled_by: "WebInterface",
          metadata: {
            model_id: "web-interface",
            assistant_id: "property-bot"
          }
        };

        // Insert into database
        await db.run(`
          INSERT INTO events (
            sender_id,
            type_name,
            timestamp,
            data,
            action_name,
            value
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          sender_id,
          'slot',
          eventData.timestamp,
          JSON.stringify(eventData),
          'final_text_filters',
          JSON.stringify(filters)
        ]);

        console.log('POST /api/sessions/:sender_id/filters - Response:', { success: true });
        res.json({ success: true });
      } catch (error) {
        console.error('Error saving filters:', error);
        const errorMessage = 'Failed to save filters';
        console.log('POST /api/sessions/:sender_id/filters - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Add a property to favorites
    app.post('/api/favorites', async (req, res) => {
      console.log('POST /api/favorites - Request:', req.body);
      try {
        const { sessionId, propertyId, filters } = req.body;

        if (!sessionId || !propertyId || !filters) {
          const errorMessage = 'Missing required fields';
          console.log('POST /api/favorites - Error Response:', { error: errorMessage });
          return res.status(400).json({ error: errorMessage });
        }

        await db.run(`
          INSERT INTO favorites (session_id, property_id, filters, timestamp)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(session_id, property_id) DO UPDATE SET
            filters = excluded.filters,
            timestamp = excluded.timestamp
        `, [sessionId, propertyId, filters, Date.now()]);

        console.log('POST /api/favorites - Response:', { success: true });
        res.json({ success: true });
      } catch (error) {
        console.error('Error saving favorite:', error);
        const errorMessage = 'Failed to save favorite';
        console.log('POST /api/favorites - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Remove a property from favorites
    app.delete('/api/favorites/:propertyId', async (req, res) => {
      const { propertyId } = req.params;
      const { sessionId } = req.query;
      console.log('DELETE /api/favorites/:propertyId - Request:', { propertyId, sessionId });
      try {
        if (!sessionId) {
          const errorMessage = 'Session ID required';
          console.log('DELETE /api/favorites/:propertyId - Error Response:', { error: errorMessage });
          return res.status(400).json({ error: errorMessage });
        }

        const result = await db.run(
          'DELETE FROM favorites WHERE session_id = ? AND property_id = ?',
          [sessionId, propertyId]
        );

        if (result.changes === 0) {
          const errorMessage = 'Favorite not found';
          console.log('DELETE /api/favorites/:propertyId - Response:', { error: errorMessage });
          return res.status(404).json({ error: errorMessage });
        }

        console.log('DELETE /api/favorites/:propertyId - Response:', { success: true });
        res.json({ success: true });
      } catch (error) {
        console.error('Error removing favorite:', error);
        const errorMessage = 'Failed to remove favorite';
        console.log('DELETE /api/favorites/:propertyId - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Get all favorites for a session
    app.get('/api/favorites', async (req, res) => {
      console.log('GET /api/favorites - Request:', req.query);
      try {
        const { sessionId } = req.query;

        if (!sessionId) {
          const errorMessage = 'Session ID required';
          console.log('GET /api/favorites - Error Response:', { error: errorMessage });
          return res.status(400).json({ error: errorMessage });
        }

        const favorites = await db.all(`
          SELECT property_id, filters, timestamp
          FROM favorites
          WHERE session_id = ?
          ORDER BY timestamp DESC
        `, [sessionId]);

        const formatted = favorites.map(fav => ({
          propertyId: fav.property_id,
          filters: fav.filters,
          timestamp: fav.timestamp
        }));

        console.log('GET /api/favorites - Response:', formatted);

        res.json(formatted);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        const errorMessage = 'Failed to fetch favorites';
        console.log('GET /api/favorites - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Check if a property is favorited
    app.get('/api/favorites/:propertyId', async (req, res) => {
      const { propertyId } = req.params;
      const { sessionId } = req.query;
      console.log('GET /api/favorites/:propertyId - Request:', { propertyId, sessionId });
      try {
        if (!sessionId) {
          const errorMessage = 'Session ID required';
          console.log('GET /api/favorites/:propertyId - Error Response:', { error: errorMessage });
          return res.status(400).json({ error: errorMessage });
        }

        const favorite = await db.get(
          'SELECT 1 FROM favorites WHERE session_id = ? AND property_id = ?',
          [sessionId, propertyId]
        );

        const isFavorite = !!favorite;
        console.log('GET /api/favorites/:propertyId - Response:', { isFavorite });
        res.json({ isFavorite });
      } catch (error) {
        console.error('Error checking favorite:', error);
        const errorMessage = 'Failed to check favorite status';
        console.log('GET /api/favorites/:propertyId - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
      }
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    // Property Details Endpoint (formatted for frontend card)
    app.get('/api/properties/:propertyId', async (req, res) => {
        const { propertyId } = req.params;
        console.log('GET /api/properties/:propertyId - Request:', { propertyId });
        
        try {
        const property = await db.get(`
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
        `, [propertyId]);
    
        if (!property) {
            const errorMessage = 'Property not found';
            console.log('GET /api/properties/:propertyId - Response:', { error: errorMessage });
            return res.status(404).json({ error: errorMessage });
        }
    
        // Format the response according to frontend requirements
        const formattedProperty = {
            id: property.PROP_ID,
            title: property.PROP_HEADING,
            price: property.PRICE,
            address: property.ADDRESS || property.LOCALITY,
            bedrooms: property.BEDROOM_NUM,
            bathrooms: property.BATHROOM_NUM,
            area: `${property.BUILTUP_SQFT} sqft`,
            type: property.PROPERTY_TYPE,
            description: property.DESCRIPTION || 'No description available',
            images: property.PHOTO_URL ? [property.PHOTO_URL] : ['https://via.placeholder.com/800x600?text=No+Image+Available'],
            amenities: property.AMENITIES ? JSON.parse(property.AMENITIES) : ['Not specified'],
            agent: {
            name: property.AGENT_NAME || 'Unknown Agent',
            phone: property.AGENT_PHONE || 'Not available',
            email: property.AGENT_EMAIL || 'no-email@example.com',
            avatar: property.AGENT_AVATAR || 'https://via.placeholder.com/150?text=Agent',
            title: property.AGENT_TITLE || 'Real Estate Agent'
            }
        };
    
        console.log('GET /api/properties/:propertyId - Response:', formattedProperty);
        res.json(formattedProperty);
        
        } catch (error) {
        console.error('Error fetching property:', error);
        const errorMessage = 'Failed to fetch property details';
        console.log('GET /api/properties/:propertyId - Error Response:', { error: errorMessage });
        res.status(500).json({ error: errorMessage });
        }
    });

    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
    })();

// Handle database connection errors
db?.on('error', (err) => {
  console.error('Database error:', err);
});
