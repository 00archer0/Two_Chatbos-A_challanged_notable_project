# 🏠 Two Chatbots with Calm: A Complete Real Estate Assistant Ecosystem

<div align="center">
  
  ![UI Banner](https://via.placeholder.com/1200x300)
  
  [![Rasa](https://img.shields.io/badge/Made_with-Rasa-5A17EE?style=for-the-badge&logo=rasa&logoColor=white)](https://rasa.com)
  [![Open Source](https://img.shields.io/badge/Open_Source-Yes-brightgreen?style=for-the-badge&logo=github&logoColor=white)](https://github.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

## 🚀 Vision: Revolutionizing Property Search with Conversational AI

Imagine finding your dream home or the perfect rental with the ease of a casual conversation. Our project introduces a cutting-edge AI-powered chatbot, built with Rasa, that transforms the complex process of property search into an intuitive and personalized experience. This chatbot doesn't just list properties; it understands your needs, answers your questions, and guides you every step of the way.

## 🔍 The Problem: Navigating the Real Estate Maze

Finding the right property can be overwhelming. Users face:

- **Information overload:** Sifting through endless listings and details.
- **Time constraints:** Scheduling viewings and gathering information is time-consuming.
- **Lack of personalization:** Generic search filters often miss unique preferences.
- **Communication gaps:** Traditional communication methods can be slow and inefficient.

## ✨ What Makes This Solution Revolutionary


Our solution introduces a groundbreaking **dual-chatbot system** that creates a seamless end-to-end real estate experience. By separating property search and dealer scheduling into two specialized AI assistants, we've created a revolutionary approach that ensures focused expertise, efficient workflows, and comprehensive support throughout the entire property journey.

<table>
  <tr>
    <th style="background-color:#4285F4; color:white;">🏘️ Property Search Assistant</th>
    <th style="background-color:#34A853; color:white;">🗓️ Dealer Visit Scheduler Bot</th>
  </tr>
  <tr>
    <td>
      • Understands complex property requirements<br>
      • Conducts personalized searches<br>
      • Provides detailed property information<br>
      • Offers neighborhood insights<br>
      • Handles property comparisons<br>
      • Manages saved properties
    </td>
    <td>
      • Confirms dealer identity<br>
      • Schedules property viewings<br>
      • Manages visit calendars<br>
      • Reschedules appointments<br>
      • Sends reminders<br>
      • Coordinates between buyers and sellers
    </td>
  </tr>
</table>

## 💡 Evolution and Problem-Solving

Two chatbots are connected to provide a seamless and comprehensive real estate experience. The first chatbot focuses on property search and user interaction, while the second chatbot handles dealer visit scheduling. This dual-chatbot system ensures that users receive personalized property recommendations and can efficiently schedule visits with dealers.

## 🤖 Chatbot System Architecture


### `Chatbot One`: Property Search Assistant 🏠

This chatbot is designed to assist users in finding their ideal property through a conversational interface.

<table>
  <tr>
    <th colspan="2" style="background-color:#4285F4; color:white;">Key Features</th>
  </tr>
  <tr>
    <td width="50%">
      <h4>👋 Welcome and Initial Inquiry</h4>
      <ul>
        <li>Greets users and determines their intent (buy or rent)</li>
        <li>Initiates the property search conversation</li>
      </ul>
    </td>
    <td width="50%">
      <h4>🔍 Dynamic Search and Filtering</h4>
      <ul>
        <li>Collects detailed user preferences</li>
        <li>Dynamically queries a database</li>
        <li><code>show_property_results_flow</code>: Displays search results</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <h4>📊 Detailed Property Information</h4>
      <ul>
        <li><code>show_property_details_flow</code>: Comprehensive details</li>
        <li><code>show_property_neighborhood_details_flow</code>: Neighborhood info</li>
        <li><code>show_property_locality_details_flow</code>: Locality info</li>
        <li>And many more specialized information flows...</li>
      </ul>
    </td>
    <td>
      <h4>⚖️ Property Comparison</h4>
      <ul>
        <li><code>property_comparison_flow</code>: Side-by-side comparison</li>
      </ul>
      <h4>💰 Buy and Rent Specific Flows</h4>
      <ul>
        <li><code>property_buy_flow</code>: For purchases</li>
        <li><code>property_rent_flow</code>: For rentals</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <h4>📅 Scheduling and Management</h4>
      <ul>
        <li><code>Visit_scheduling_flow</code>: Schedules viewings</li>
        <li><code>check_scheduled_visits_flow</code>: Checks visits</li>
        <li><code>reschedule_visit_flow</code>: Reschedules visits</li>
        <li><code>cancel_visit_flow</code>: Cancels visits</li>
      </ul>
    </td>
    <td>
      <h4>👤 User Management</h4>
      <ul>
        <li><code>show_saved_properties_flow</code>: Saved properties</li>
      </ul>
      <h4>🔄 Search Reset</h4>
      <ul>
        <li><code>reset_flow</code>: Clears all search filters</li>
      </ul>
    </td>
  </tr>
</table>

### `Chatbot Two`: Dealer Visit Scheduler 📅

This chatbot streamlines the process of scheduling client visits with dealers.

<table>
  <tr>
    <th colspan="2" style="background-color:#34A853; color:white;">Call Flows</th>
  </tr>
  <tr>
    <td width="50%">
      <h4>👋 <code>greeting_flow</code></h4>
      <ul>
        <li>Greets the dealer and confirms identity</li>
        <li>Transitions to appropriate next flow</li>
      </ul>
    </td>
    <td width="50%">
      <h4>ℹ️ <code>explain_flow</code></h4>
      <ul>
        <li>Explains conversation purpose</li>
        <li>Collects visit details</li>
        <li>Confirms schedule</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <h4>👋 <code>goodbye</code></h4>
      <ul>
        <li>Ends the conversation with a farewell message</li>
      </ul>
    </td>
    <td>
      <h4>📞 <code>alternate_contact_flow</code></h4>
      <ul>
        <li>Collects alternate contact information</li>
      </ul>
    </td>
  </tr>
</table>

#### Rasa's Calm System Patterns 🧘

- **`list_skills`**: Provides information about the chatbot's capabilities.
- **`pattern_cannot_handle`**: Handles user inputs that the chatbot doesn't understand.
- **`pattern_search`**: Handles FAQ.
- **`out_of_scope`**: Handles off-topic user requests that won't disrupt the main flow.
- **`pattern_chitchat`**: Handles off-topic conversation that won't disrupt the main flow.

## 📱 Custom Rasa UI

The custom Rasa UI for real estate focuses on the following compelling features:

- **Conversational interface** for property search.
- **Property cards** with visual representation and key details.
- **Session management** that preserves conversation history.
- **Advanced filtering capabilities**.
- The ability to **save favorite properties**.

## 🛠️ Technology Stack


- **Rasa framework** (Calm, RAG)
- **Faiss vector database**
- **SQLite SQL database**
- **HTML, CSS, JS** for front end
- **Flask API**
- **GitHub Codespace, Docker**

## 📂 Project Structure

```
Rasa Challange/
├── rasa/                              # Rasa chatbot implementation
│   ├── actions/                     # Custom action server code (Python)
│   │   └── action.py                  # Contains custom action logic.
│   ├── data/                          # Training data for NLU, stories, and rules.
│   │   ├── flows/                   # Rasa flow data.
│   │   │   ├── flows.yml              # Conversational flows defined in YAML.
│   │   │   ├── patterns.yml           # NLU patterns for entity extraction.
│   │   │   └── utils.yml              # Utility functions for flows.
│   │   └── domain/                    # Rasa domain configuration.
│   │       ├── basic_prop_filters.yml # Domain configuration for property filters.
│   │       ├── domain.yml             # Core domain definition (intents, entities, slots).
│   │       └── shared.yml             # Shared domain components.
│   ├── models/                        # Trained Rasa model files.
│   ├── prompt_templates/              # Jinja2 prompt templates for LLM interaction.
│   │   ├── classifier.jinja2          # Template for intent classification.
│   │   ├── filters.jinja2             # Template for filtering properties.
│   │   ├── rephrase_prompt.jinja2     # Template for rephrasing user input.
│   │   └── time_aware_prompt.jinja2   # Template for time aware conversation.
│   ├── LLMclassifier.py             # Custom intent classifier using LLMs.
│   └── simple_entity_extractor.py   # Custom entity extractor for simple entities.
├── api/                               # Backend API services (Python Flask)
│   ├── server.py                      # Main API server script.
│   ├── table_create.py                # Script for creating database tables.
├── frontend/                        # Custom frontend application (HTML, JavaScript, CSS).
│   ├── demo.html                      # Main HTML file for the demo.
│   ├── filter_script.js               # JavaScript for filter interactions.
│   ├── filters_data.js                # Data for filter options.
│   ├── filters_style.css              # CSS styling for filters.
│   ├── script.js                      # Main JavaScript logic.
│   └── style.css                      # Main CSS styling.
├── realstate_data/                    # Real estate data (e.g., JSON, CSV).
│   └── ...                            # Data files for various cities/properties.
├── .devcontainer/                     # Dev container configuration.
│   └── setup.sh                       # Script to setup dev environment.
├── launch.sh                          # Shell script to launch the application.
└── endpoints.yml                      # Rasa endpoints configuration.
```

## 🚀 Rasa Challenge Alignment

<table>
  <tr>
    <th style="background-color:#DB4437; color:white;">Feature/Question</th>
    <th style="background-color:#0F9D58; color:white;">Answer</th>
  </tr>
  <tr>
    <td>Uniqueness & Problem-Solving</td>
    <td>✅</td>
  </tr>
  <tr>
    <td>Handles Complex Conversations</td>
    <td>✅</td>
  </tr>
  <tr>
    <td>Combines RAG and Transactional Flows Effectively</td>
    <td>✅</td>
  </tr>
  <tr>
    <td>Integrations with Sophisticated Backend Systems</td>
    <td>✅</td>
  </tr>
  <tr>
    <td>Uses Open-Source LLMs</td>
    <td>✅</td>
  </tr>
  <tr>
    <td>Uses Fine-Tuned Models</td>
    <td>✅</td>
  </tr>
  <tr>
    <td>Integrations with Other AI Tools</td>
    <td>✅</td>
  </tr>
</table>

## 📞 Call to Action: Let's Build the Future of Real Estate

This project demonstrates the power of conversational AI in transforming the real estate industry. We're excited to collaborate and bring this innovative solution to the Rasa challenge.



</div>
