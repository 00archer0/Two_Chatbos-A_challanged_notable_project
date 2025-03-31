## Two Chatbots with Calm: An AI-Powered Real Estate Chatbot

---

### **Vision: Revolutionizing Property Search with Conversational AI**

Imagine finding your dream home or the perfect rental with the ease of a casual conversation. Our project introduces a cutting-edge AI-powered chatbot, built with Rasa, that transforms the complex process of property search into an intuitive and personalized experience. This chatbot doesn't just list properties; it understands your needs, answers your questions, and guides you every step of the way.

### **The Problem: Navigating the Real Estate Maze**

Finding the right property can be overwhelming. Users face:

- **Information overload:** Sifting through endless listings and details.
- **Time constraints:** Scheduling viewings and gathering information is time-consuming.
- **Lack of personalization:** Generic search filters often miss unique preferences.
- **Communication gaps:** Traditional communication methods can be slow and inefficient.

### **Our Solution: An Intelligent Conversational Partner**

#### **Evolution and Problem-Solving**

Two chatbots are connected to provide a seamless and comprehensive real estate experience. The first chatbot focuses on property search and user interaction, while the second chatbot handles dealer visit scheduling. This dual-chatbot system ensures that users receive personalized property recommendations and can efficiently schedule visits with dealers.

#### `Chatbot One`: Property Search Assistant

This chatbot is designed to assist users in finding their ideal property through a conversational interface.

- **Welcome and Initial Inquiry:**
  - Greets users and determines their intent (buy or rent).
  - Initiates the property search conversation.

- **Dynamic Search and Filtering:**
  - Collects detailed user preferences (bedrooms, bathrooms, area, budget, amenities, location).
  - Dynamically queries a database to retrieve relevant property listings.
  - `show_property_results_flow`: Displays search results based on user-provided criteria.

- **Detailed Property Information:**
  - `show_property_details_flow`: Provides comprehensive details about a specific property.
  - `show_property_neighborhood_details_flow`: Presents neighborhood information.
  - `show_property_locality_details_flow`: Presents locality information.
  - `show_property_society_details_flow`: Presents society information.
  - `show_property_cultural_details_flow`: Presents cultural information.
  - `show_property_amenities_details_flow`: Presents amenities information.
  - `show_property_transport_details_flow`: Presents transportation information.
  - `show_property_school_details_flow`: Presents school information.
  - `show_property_safety_details_flow`: Presents safety information.
  - `show_property_commercial_details_flow`: Presents commercial information.

- **Property Comparison:**
  - `property_comparison_flow`: Enables side-by-side comparison of properties.

- **Buy and Rent Specific Flows:**
  - `property_buy_flow`: Tailored conversation for property purchase.
  - `property_rent_flow`: Tailored conversation for rental properties.

- **Scheduling and Management:**
  - `Visit_scheduling_flow`: Schedules property viewings.
  - `check_scheduled_visits_flow`: Checks scheduled visits.
  - `reschedule_visit_flow`: Reschedules visits.
  - `cancel_visit_flow`: Cancels visits.

- **User Management:**
  - `show_saved_properties_flow`: Displays saved properties.

- **Search Reset:**
  - `reset_flow`: Clears all search filters.

#### `Chatbot Two`: Dealer Visit Scheduler

This chatbot is designed to streamline the process of scheduling client visits with dealers.

##### Call Flows

- **`greeting_flow`**:
  - Greets the dealer and confirms their identity.
  - Transitions to `explain_flow` if identity is confirmed, or `alternate_contact_flow` if not.

- **`explain_flow`**:
  - Explains the purpose of the conversation (scheduling visits).
  - Collects visit date, time, and alternate contact information.
  - Confirms the schedule and transitions to `goodbye`.

- **`goodbye`**:
  - Ends the conversation with a farewell message.

- **`alternate_contact_flow`**:
  - Collects alternate contact information for the dealer.

##### Rasa's Calm System Patterns

- **`list_skills`**:
  - Provides information about the chatbot's capabilities.

- **`pattern_cannot_handle`**:
  - Handles user inputs that the chatbot doesn't understand.

- **`pattern_search`**:
  - Handles FAQ.

- **`out_of_scope`**:
  - Handles off-topic user requests that won't disrupt the main flow.

- **`pattern_chitchat`**:
  - Handles off-topic conversation that won't disrupt the main flow.

### **Call to Action: Let's Build the Future of Real Estate**

Demonstrates the power of conversational AI in transforming the real estate industry. I'm excited to collaborate and bring this innovative solution to the Rasa challenge.

### **Rasa Challenge Alignment**

| Feature/Question                                                                 | Answer |
| :------------------------------------------------------------------------------- | :----- |
| **Uniqueness & Problem-Solving**                                                | ✅     |
| **Handles Complex Conversations (context switch, corrections, interruptions)**  | ✅     |
| **Combines RAG and Transactional Flows Effectively**                            | ✅     |
| **Integrations with Sophisticated Backend Systems**                             | ✅     |
| **Uses Open-Source LLMs**                                                       | ✅ (Optional) |
| **Uses Fine-Tuned Models**                                                      | ✅ (Optional) |
| **Integrations with Other AI Tools**                                            | ✅     |

## **Custom Rasa UI**

The custom Rasa UI for real estate focuses on the following compelling features:

- Conversational interface for property search.
- Property cards with visual representation and key details.
- Session management that preserves conversation history.
- Advanced filtering capabilities.
- The ability to save favorite properties.

### **Technology Used**

- Rasa framework (Calm, RAG)
- Faiss vector database
- SQLite SQL database
- HTML, CSS, JS for front end
- Flask API
- GitHub Codespace, Docker

homefindr-ai/
├── .devcontainer/
│   └── setup.sh                     # Initial setup script for dev container
│         
├── calling_bot_calm/                # RASA Directory for calling bot
│   ├── data/flows/flows.yml             # Rasa flow data
│   ├── domain/domain.yml                # Rasa domain configuration
│   └── endpoints.yml                    # Rasa endpoints configuration
│         
├── frontent_rasa_custom/            # Custom Rasa frontend
│   ├── demo.html                        # HTML demo page
│   ├── filter_script.js                 # Filter functionality
│   ├── filters_data.js         # Filter data
│   ├── filters_style.css       # Filter styling
│   ├── script.js                        # Main JavaScript
│   └── style.css                        # Main CSS
│         
├── launch.sh                         # Application launcher script
│         
├── realstate_bot_calm/               # Real estate bot implementation
│   ├── LLMclassifier.py              # Custom LLM intent classifier
│   ├── simple_entity_extractor.py    # Custom entity extraction
│   ├── actions/                      # Custom Rasa actions
│   │   └── action.py                    # Action code
│   ├── data/flows/                   # Flow definitions
│   │   ├── flows.yml                    # Main flows
│   │   ├── patterns.yml                 # Pattern definitions
│   │   └── utils.yml                    # Utility flows
│   ├── docs/                            # Documentation
│   ├── domain/                          # Domain configurations
│   │   ├── basic_prop_filters.yml       # Property filter definitions
│   │   ├── domain.yml                   # Main domain file
│   │   └── shared.yml                   # Shared domain components
│   └── prompt_templates/                # Jinja2 templates
│       ├── classifier.jinja2            # Classification prompts
│       ├── filters.jinja2               # Filter prompts
│       ├── rephrase_prompt.jinja2       # Rephrasing prompts
│       └── time_aware_prompt.jinja2     # Time-aware prompts
│
├── realstate_data/                      # Real estate datasets by city
│         
├── server.py                            # API server implementation
└── table_create.py                      # Database table creation script

---

This formatted document provides a clear and structured overview of the AI-powered real estate chatbot project, highlighting its vision, problem-solving approach, features, and technology stack.
