# Two Chatbots with Calm: An AI-Powered Real Estate Solution

## Vision: Revolutionizing Property Search with Conversational AI

Imagine finding your dream home or the perfect rental with the ease of a casual conversation. Our project introduces a cutting-edge AI-powered chatbot system, built with Rasa, that transforms the complex process of property search into an intuitive and personalized experience. This solution doesn't just list properties; it understands your needs, answers your questions, and guides you every step of the way.

## The Problem: Navigating the Real Estate Maze

Finding the right property can be overwhelming. Users face:

* **Information overload:** Sifting through endless listings and details
* **Time constraints:** Scheduling viewings and gathering information is time-consuming
* **Lack of personalization:** Generic search filters often miss unique preferences
* **Communication gaps:** Traditional communication methods can be slow and inefficient

## Our Solution: A Dual Chatbot System with Evolutionary Approach

Our solution consists of two integrated chatbots that work together to provide a seamless experience, solving the complex problems of property search and scheduling:

### Chatbot One: Property Search Assistant

This chatbot is designed to assist users in finding their ideal property through a conversational interface:

* **Welcome and Initial Inquiry:**
  * Greets users and determines their intent (buy or rent)
  * Initiates the property search conversation

* **Dynamic Search and Filtering:**
  * Collects detailed user preferences (bedrooms, bathrooms, area, budget, amenities, location)
  * Dynamically queries a database to retrieve relevant property listings
  * Displays search results based on user-provided criteria

* **Detailed Property Information:**
  * Provides comprehensive details about specific properties
  * Presents information on neighborhoods, localities, societies, cultural aspects
  * Offers details about amenities, transportation, schools, safety, and commercial facilities

* **Property Comparison:**
  * Enables side-by-side comparison of properties

* **Buy and Rent Specific Flows:**
  * Tailored conversation paths for property purchase
  * Specialized dialogue for rental properties

* **Scheduling and Management:**
  * Schedules property viewings
  * Manages scheduled visits
  * Handles rescheduling and cancellations

* **User Management:**
  * Tracks and displays saved properties

* **Search Reset:**
  * Clears all search filters when needed

### Chatbot Two: Dealer Visit Scheduler

This chatbot streamlines the process of scheduling client visits with dealers:

#### Call Flows
* **Greeting Flow:**
  * Greets the dealer and confirms their identity
  * Transitions to explanation or alternate contact collection based on confirmation

* **Explanation Flow:**
  * Explains the purpose of the conversation (scheduling visits)
  * Collects visit date, time, and alternate contact information
  * Confirms the schedule before ending the conversation

* **Alternate Contact Flow:**
  * Collects alternate contact information for the dealer

* **Goodbye Flow:**
  * Ends the conversation appropriately

#### Rasa's Calm System Patterns

* **List Skills:**
  * Provides information about the chatbot's capabilities

* **Pattern Cannot Handle:**
  * Manages user inputs that the chatbot doesn't understand

* **Pattern Search:**
  * Handles frequently asked questions

* **Out of Scope:**
  * Handles off-topic user requests without disrupting the main flow

* **Pattern Chitchat:**
  * Manages casual conversation without derailing the primary task

## Custom Rasa UI

Our solution features a custom Rasa UI specifically designed for real estate, including:

* Intuitive conversational interface for property search
* Property cards with visual representation and key details
* Session management that preserves conversation history
* Advanced filtering capabilities
* Ability to save favorite properties

## Technology Stack

* Rasa framework with Calm architecture
* Retrieval Augmented Generation (RAG)
* FAISS vector database
* SQLite for relational data storage
* HTML, CSS, JavaScript for frontend
* Flask API for backend services
* GitHub Codespaces and Docker for development and deployment

## Rasa Challenge Alignment

| Feature/Question | Answer |
| :--------------- | :----- |
| **Uniqueness & Problem-Solving** | ✅ |
| **Handles Complex Conversations** | ✅ |
| **Combines RAG and Transactional Flows** | ✅ |
| **Integrations with Backend Systems** | ✅ |
| **Uses Open-Source LLMs** | ✅ (Optional) |
| **Uses Fine-Tuned Models** | ✅ (Optional) |
| **Integrations with Other AI Tools** | ✅ |

## Call to Action: Let's Build the Future of Real Estate

This proposal demonstrates the power of conversational AI in transforming the real estate industry. We're excited to collaborate and bring this innovative solution to the Rasa challenge.