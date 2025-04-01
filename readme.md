# $\color{#4285F4}{\textsf{\Large Two Chatbots with Calm:}}$ $\color{#34A853}{\textsf{\Large A Complete Real Estate Assistant Ecosystem}}$

<div align="center">

[![Rasa](https://img.shields.io/badge/Made_with-Rasa-5A17EE?style=for-the-badge&logo=rasa&logoColor=white)](https://rasa.com)
[![Open Source](https://img.shields.io/badge/Open_Source-Yes-brightgreen?style=for-the-badge&logo=github&logoColor=white)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

## $\color{#4285F4}{\textsf{Vision:}}$ $\color{#34A853}{\textsf{Revolutionizing Property Search with Conversational AI}}$

Imagine finding your dream home or the perfect rental with the ease of a casual conversation. Our project introduces a cutting-edge AI-powered chatbot, built with Rasa, that transforms the complex process of property search into an intuitive and personalized experience. This chatbot doesn't just list properties; it understands your needs, answers your questions, and guides you every step of the way.

## $\color{#4285F4}{\textsf{The Problem:}}$ $\color{#DB4437}{\textsf{Navigating the Real Estate Maze}}$

Finding the right property can be overwhelming. Users face:

- $\color{#DB4437}{\textsf{Information overload:}}$ Sifting through endless listings and details.
- $\color{#DB4437}{\textsf{Time constraints:}}$ Scheduling viewings and gathering information is time-consuming.
- $\color{#DB4437}{\textsf{Lack of personalization:}}$ Generic search filters often miss unique preferences.
- $\color{#DB4437}{\textsf{Communication gaps:}}$ Traditional communication methods can be slow and inefficient.

## $\color{#4285F4}{\textsf{What Makes This Solution Revolutionary}}$

Our solution introduces a groundbreaking dual-chatbot system that creates a seamless end-to-end real estate experience. By separating property search and dealer scheduling into two specialized AI assistants, we've created a revolutionary approach that ensures focused expertise, efficient workflows, and comprehensive support throughout the entire property journey.

<div align="center">

| $\color{#4285F4}{\textsf{Property Search Assistant}}$ | $\color{#34A853}{\textsf{Dealer Visit Scheduler Bot}}$ |
|------------------------|--------------------------------|
| • Understands complex property requirements<br>• Conducts personalized searches<br>• Provides detailed property information<br>• Offers neighborhood insights<br>• Handles property comparisons<br>• Manages saved properties | • Confirms dealer identity<br>• Schedules property viewings<br>• Manages visit calendars<br>• Reschedules appointments<br>• Sends reminders<br>• Coordinates between buyers and sellers |

</div>

## $\color{#4285F4}{\textsf{Evolution and Problem-Solving}}$

Two chatbots are connected to provide a seamless and comprehensive real estate experience. The first chatbot focuses on property search and user interaction, while the second chatbot handles dealer visit scheduling. This dual-chatbot system ensures that users receive personalized property recommendations and can efficiently schedule visits with dealers.

## $\color{#4285F4}{\textsf{Chatbot System Architecture}}$

### $\color{#4285F4}{\textsf{Chatbot One:}}$ $\color{#4285F4}{\textsf{Property Search Assistant}}$

This chatbot is designed to assist users in finding their ideal property through a conversational interface.

- $\color{#4285F4}{\textsf{Welcome and Initial Inquiry:}}$
  - Greets users and determines their intent (buy or rent).
  - Initiates the property search conversation.

- $\color{#4285F4}{\textsf{Dynamic Search and Filtering:}}$
  - Collects detailed user preferences (bedrooms, bathrooms, area, budget, amenities, location).
  - Dynamically queries a database to retrieve relevant property listings.
  - `show_property_results_flow`: Displays search results based on user-provided criteria.

- $\color{#4285F4}{\textsf{Detailed Property Information:}}$
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

- $\color{#4285F4}{\textsf{Property Comparison:}}$
  - `property_comparison_flow`: Enables side-by-side comparison of properties.

- $\color{#4285F4}{\textsf{Buy and Rent Specific Flows:}}$
  - `property_buy_flow`: Tailored conversation for property purchase.
  - `property_rent_flow`: Tailored conversation for rental properties.

- $\color{#4285F4}{\textsf{Scheduling and Management:}}$
  - `Visit_scheduling_flow`: Schedules property viewings.
  - `check_scheduled_visits_flow`: Checks scheduled visits.
  - `reschedule_visit_flow`: Reschedules visits.
  - `cancel_visit_flow`: Cancels visits.

- $\color{#4285F4}{\textsf{User Management:}}$
  - `show_saved_properties_flow`: Displays saved properties.

- $\color{#4285F4}{\textsf{Search Reset:}}$
  - `reset_flow`: Clears all search filters.

### $\color{#34A853}{\textsf{Chatbot Two:}}$ $\color{#34A853}{\textsf{Dealer Visit Scheduler}}$

This chatbot is designed to streamline the process of scheduling client visits with dealers.

#### $\color{#34A853}{\textsf{Call Flows}}$

- $\color{#34A853}{\textsf{greeting_flow:}}$
  - Greets the dealer and confirms their identity.
  - Transitions to `explain_flow` if identity is confirmed, or `alternate_contact_flow` if not.

- $\color{#34A853}{\textsf{explain_flow:}}$
  - Explains the purpose of the conversation (scheduling visits).
  - Collects visit date, time, and alternate contact information.
  - Confirms the schedule and transitions to `goodbye`.

- $\color{#34A853}{\textsf{goodbye:}}$
  - Ends the conversation with a farewell message.

- $\color{#34A853}{\textsf{alternate_contact_flow:}}$
  - Collects alternate contact information for the dealer.

#### $\color{#34A853}{\textsf{Rasa's Calm System Patterns}}$

- $\color{#34A853}{\textsf{list_skills:}}$
  - Provides information about the chatbot's capabilities.

- $\color{#34A853}{\textsf{pattern_cannot_handle:}}$
  - Handles user inputs that the chatbot doesn't understand.

- $\color{#34A853}{\textsf{pattern_search:}}$
  - Handles FAQ.

- $\color{#34A853}{\textsf{out_of_scope:}}$
  - Handles off-topic user requests that won't disrupt the main flow.

- $\color{#34A853}{\textsf{pattern_chitchat:}}$
  - Handles off-topic conversation that won't disrupt the main flow.

## $\color{#F4B400}{\textsf{Call to Action:}}$ $\color{#F4B400}{\textsf{Let's Build the Future of Real Estate}}$

This project demonstrates the power of conversational AI in transforming the real estate industry. We're excited to collaborate and bring this innovative solution to the Rasa challenge.

## $\color{#F4B400}{\textsf{Custom Rasa UI}}$

The custom Rasa UI for real estate focuses on the following compelling features:

- $\color{#F4B400}{\textsf{Conversational interface}}$ for property search.
- $\color{#F4B400}{\textsf{Property cards}}$ with visual representation and key details.
- $\color{#F4B400}{\textsf{Session management}}$ that preserves conversation history.
- $\color{#F4B400}{\textsf{Advanced filtering capabilities.}}$
- The ability to $\color{#F4B400}{\textsf{save favorite properties.}}$

## $\color{#DB4437}{\textsf{Technology Used}}$

- $\color{#DB4437}{\textsf{Rasa framework}}$ (Calm, RAG)
- $\color{#DB4437}{\textsf{Faiss vector database}}$
- $\color{#DB4437}{\textsf{SQLite SQL database}}$
- $\color{#DB4437}{\textsf{HTML, CSS, JS}}$ for front end
- $\color{#DB4437}{\textsf{Flask API}}$
- $\color{#DB4437}{\textsf{GitHub Codespace, Docker}}$

## $\color{#DB4437}{\textsf{Project Structure}}$

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

## $\color{#F4B400}{\textsf{Rasa Challenge Alignment}}$

<div align="center">

| $\color{#DB4437}{\textsf{Feature/Question}}$ | $\color{#0F9D58}{\textsf{Answer}}$ |
| :------------------------------------------------------------------------------- | :----- |
| $\color{#DB4437}{\textsf{Uniqueness & Problem-Solving}}$ | ✅     |
| $\color{#DB4437}{\textsf{Handles Complex Conversations}}$ | ✅     |
| $\color{#DB4437}{\textsf{Combines RAG and Transactional Flows Effectively}}$ | ✅     |
| $\color{#DB4437}{\textsf{Integrations with Sophisticated Backend Systems}}$ | ✅     |
| $\color{#DB4437}{\textsf{Uses Open-Source LLMs}}$ | ✅ |
| $\color{#DB4437}{\textsf{Uses Fine-Tuned Models}}$ | ✅  |
| $\color{#DB4437}{\textsf{Integrations with Other AI Tools}}$ | ✅     |

</div>

