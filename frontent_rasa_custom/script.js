// Import filter-related data and functions
import { filterData } from './filters_data.js';
import { loadFiltersFromStorage, renderFilters, loadUserFilters, updateAppliedFilters, createAppliedFilterChip, getAppliedFilters, applyBotFilters } from './filter_script.js';

// API Configuration
const API_BASE = 'http://localhost:3333';

// Global variables
let currentSessionId = sessionStorage.getItem('currentSessionId') || null;
let propertyModalInstance = null;
let chatHistory = {}; // Store chat history in memory
let userFavorites = {}; // Store user favorites in memory
let sessions = []; // Store sessions in memory
// Add global timer variables
let typingStartTime;
let timerInterval;


// DOM elements
const sessionListElement = document.getElementById('sessionList');
const chatMessagesElement = document.getElementById('chatMessages');
const currentUserNameElement = document.getElementById('currentUserName');
const currentUserAvatarElement = document.getElementById('currentUserAvatar');
const currentSessionMetaElement = document.getElementById('currentSessionMeta');
const messageInputElement = document.getElementById('messageInput');
const sendMessageBtnElement = document.getElementById('sendMessageBtn');
const rightPanelElement = document.getElementById('rightPanel');
const propertyModalBodyElement = document.getElementById('propertyModalBody');
const propertyModalTitleElement = document.getElementById('propertyModalTitle');

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    loadFiltersFromStorage(); // Load filters before rendering
    updateSavedPropertiesCount();
});

document.getElementById('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    // Handle sending the message without a page reload
});

// Fetch sessions from API
let cachedSessions = null;
async function fetchSessions() {
    if (cachedSessions) return cachedSessions;

    try {
        const response = await fetch(`${API_BASE}/api/rasa-session`);
        const data = await response.json();
        cachedSessions = data.map(session => ({
            id: session.sender_id,
            headText: `Session ${session.sender_id.slice(0, 6)}`,
            lastMessage: "Session started",
            lastMessageTime: new Date(session.timestamp * 1000).toLocaleTimeString(),
            status: "active",
            filters: JSON.parse(JSON.stringify(filterData))
        }));
        return cachedSessions;
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }
}
// Fetch chat history from API
async function fetchChatHistory(sessionId) {
    try {
        const response = await fetch(`${API_BASE}/api/conversation/${encodeURIComponent(sessionId)}`);
        const data = await response.json();
        return data.map(event => transformApiEventToMessage(event));
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }
}

window.addEventListener('filtersCleared', (e) => {
    if (currentSessionId) {
        // Create and display user message
        const userMessage = {
            sender: 'user',
            message: e.detail,
            time: getCurrentTime()
        };

        // Add to chat history
        if (!chatHistory[currentSessionId]) {
            chatHistory[currentSessionId] = [];
        }
        chatHistory[currentSessionId].push(userMessage);
        displayMessage(userMessage);
        scrollToBottom();

        // Send to Rasa
        simulateNaturalLanguageFilter(e.detail);
    }
});

// Transform API event to chat message format
function transformApiEventToMessage(event) {
    const baseMessage = {
        time: new Date(event.timestamp * 1000).toLocaleTimeString(),
    };

    if (event.event === 'user') {
        return {
            ...baseMessage,
            sender: 'user',
            message: event.text
        };
    }

    if (event.event === 'bot' && event.data) {
        const botMessage = {
            ...baseMessage,
            sender: 'bot',
            message: event.text,
            properties: event.data.custom?.properties || [], // Include full property details
            newsArticle: event.data.custom?.articles || [], // Include full article details
            quickReplies: event.data.buttons?.map(b => b.title) || []
        };
        return botMessage;
    }

    return null;
}

// Initialize the application
async function initializeApp() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap not loaded yet');
        setTimeout(initializeApp, 100);
        return;
    }

    // Initialize modal
    const propertyModal = document.getElementById('propertyDetailModal');
    if (propertyModal) {
        try {
            propertyModalInstance = new bootstrap.Modal(propertyModal);
        } catch (error) {
            console.error('Failed to initialize modal:', error);
        }
    }

    // Fetch and populate sessions
    sessions = await fetchSessions();
    populateSessionList();


    // Set up event listeners
    setupEventListeners();
    setupFilterListeners();



    // Get session ID from storage
    currentSessionId = sessionStorage.getItem('currentSessionId');

    // Auto-select first session if none selected
    if (!currentSessionId && sessions.length > 0) {
        selectSession(sessions[0].id);
    } else if (currentSessionId) {
        // Load the saved session
        await loadSavedSession(currentSessionId);
        loadFiltersFromStorage();
        updateSavedPropertiesCount();
    }
}

// Add a new function to load a saved session
async function loadSavedSession(sessionId) {
    // Find the session in the list
    const selectedSession = sessions.find(s => s.id === sessionId);

    if (!selectedSession) {
        console.warn('Saved session not found, selecting first available session');
        if (sessions.length > 0) {
            selectSession(sessions[0].id);
        }
        return;
    }

    // Update UI to show the selected session
    const sessionItems = document.querySelectorAll('.session-item');
    sessionItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-session-id') === sessionId) {
            item.classList.add('active');
        }
    });

    currentUserNameElement.textContent = selectedSession.headText;
    // currentSessionMetaElement.textContent = `Last active: ${selectedSession.lastMessageTime}`;

    // Load favorites FIRST
    try {
        userFavorites[sessionId] = await loadFavoritesFromDB(sessionId);
    } catch (error) {
        console.error('Error loading favorites:', error);
        userFavorites[sessionId] = []; // Ensure array exists
    }

    // Fetch saved filters from server
    try {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/filters`);
        const { filters: savedFilters } = await response.json();

        if (savedFilters && savedFilters.length > 0) {
            // Create a fresh copy of the filter structure
            const transformedFilters = JSON.parse(JSON.stringify(filterData));

            // Apply saved filters to the structure
            savedFilters.forEach(savedFilter => {
                const section = transformedFilters[savedFilter.type];
                if (section) {
                    if (section.type === "chips") {
                        section.options.forEach(opt => {
                            opt.enabled = savedFilter.value.includes(opt.name);
                        });
                    } else if (section.type === "range" || section.type === "dualRange") {
                        // Handle range values if needed (example)
                        if (savedFilter.value.min !== undefined) {
                            section.options.currentMin = savedFilter.value.min;
                        }
                        if (savedFilter.value.max !== undefined) {
                            section.options.currentMax = savedFilter.value.max;
                        }
                    }
                }
            });

            // Load the combined filters
            loadUserFilters(transformedFilters);
        } else {
            // No saved filters - load default structure
            loadUserFilters(JSON.parse(JSON.stringify(filterData)));
        }
    } catch (error) {
        console.error('Error loading saved filters:', error);
        // Fallback to default filters if there's an error
        loadUserFilters(JSON.parse(JSON.stringify(filterData)));
    }

    // Load chat history from cache or API
    if (!chatHistory[sessionId]) {
        const history = await fetchChatHistory(sessionId);
        chatHistory[sessionId] = history.filter(Boolean);
    }

    // Load chat history
    loadChatHistory(sessionId);



    // Mobile handling
    if (window.innerWidth < 768) {
        document.querySelector('.left-panel').style.display = 'none';
        document.querySelector('.middle-panel').style.display = 'flex';
    }

    updateSavedPropertiesCount(); 
}

// Populate session list
function populateSessionList() {
    sessionListElement.innerHTML = '';
    sessions.forEach(session => {
        const sessionElement = document.createElement('div');
        sessionElement.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
        sessionElement.setAttribute('data-session-id', session.id);

        sessionElement.innerHTML = `
            <div class="session-info">
                <p class="last-message">${session.lastMessage} at ${session.lastMessageTime}</p>
            </div>
        `;

        sessionElement.addEventListener('click', () => selectSession(session.id));
        sessionListElement.appendChild(sessionElement);
    });
}

// Select a session
async function selectSession(sessionId) {
    // Clear any existing typing indicators
    removeTypingIndicator();

    // Update current session ID
    currentSessionId = sessionId;
    sessionStorage.setItem('currentSessionId', sessionId);

    // Update UI to show the selected session
    const sessionItems = document.querySelectorAll('.session-item');
    sessionItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-session-id') === sessionId) {
            item.classList.add('active');
        }
    });

    // Find the selected session
    const selectedSession = sessions.find(s => s.id === sessionId);
    if (!selectedSession) {
        console.warn('Selected session not found');
        return;
    }

    // Update UI with session info
    currentUserNameElement.textContent = selectedSession.headText;
    // currentSessionMetaElement.textContent = `Last active: ${selectedSession.lastMessageTime}`;

    // Load favorites for this session
    try {
        if (!userFavorites[sessionId]) {
            userFavorites[sessionId] = await loadFavoritesFromDB(sessionId);
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        userFavorites[sessionId] = []; // Ensure array exists
    }

    // Load saved filters for this session
    try {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/filters`);
        const { filters: savedFilters } = await response.json();

        // Update the session's filters in memory
        if (savedFilters && savedFilters.length > 0) {
            selectedSession.filters = transformSavedFilters(savedFilters);
        } else {
            // No saved filters - reset to default
            selectedSession.filters = JSON.parse(JSON.stringify(filterData));
        }

        // Apply the filters to the UI
        loadUserFilters(selectedSession.filters);
    } catch (error) {
        console.error('Error loading saved filters:', error);
        // Fallback to default filters
        selectedSession.filters = JSON.parse(JSON.stringify(filterData));
        loadUserFilters(selectedSession.filters);
    }

    // Load chat history from cache or API
    if (!chatHistory[sessionId]) {
        const history = await fetchChatHistory(sessionId);
        chatHistory[sessionId] = history.filter(Boolean);
    }

    // Display the chat history
    loadChatHistory(sessionId);

    // Mobile handling
    if (window.innerWidth < 768) {
        document.querySelector('.left-panel').style.display = 'none';
        document.querySelector('.middle-panel').style.display = 'flex';
    }
    // Add this at the end of the function
    if (document.getElementById('otherTab').classList.contains('active')) {
        await displaySavedFavorites();
    }
    updateFavoriteStatuses();
    updateSavedPropertiesCount();
    // Update any property cards with favorite status

}

// Helper function to update all property cards with current favorite status
function updateFavoriteStatuses() {
    if (!currentSessionId) return;

    const currentFavorites = userFavorites[currentSessionId] || [];
    document.querySelectorAll('.property-card').forEach(card => {
        const propertyId = card.getAttribute('data-property-id');
        const heartIcon = card.querySelector('.favorite-button i');

        if (heartIcon) {
            if (currentFavorites.includes(propertyId)) {
                heartIcon.classList.add('fas');
                heartIcon.classList.remove('far');
            } else {
                heartIcon.classList.add('far');
                heartIcon.classList.remove('fas');
            }
        }
    });
}

// Load chat history
function loadChatHistory(sessionId) {
    chatMessagesElement.innerHTML = '';
    const history = chatHistory[sessionId] || [];
    history.forEach(message => displayMessage(message));
    scrollToBottom();
}

// Display a message in the chat UI
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${message.sender}`;

    let messageContent = `
        <div class="message-content">
            ${message.message}
        </div>
        <div class="message-time">${message.time}</div>
    `;

    // Add response time for bot messages
    if (message.sender === 'bot' && message.responseTime) {
        messageContent += `
            <div class="response-time">
                Response time: ${message.responseTime.toFixed(1)}s
            </div>
        `;
    }

    // Add property carousel if available
    if (message.properties && message.properties.length > 0) {
        let propertyCarouselHTML = '<div class="property-carousel">';
        message.properties.forEach(property => {
            propertyCarouselHTML += createPropertyCard(property); // Pass the full property object
        });
        propertyCarouselHTML += '</div>';
        messageContent += propertyCarouselHTML;
    }


    // Add news article if available
    if (message.newsArticle && message.newsArticle.length > 0) {
        let newsCardsHTML = '<div class="news-container"><div class="news-scroll">';
        message.newsArticle.forEach(article => {
            newsCardsHTML += createNewsCard(article); // Pass the full article object
        });
        newsCardsHTML += '</div></div>';
        messageContent += newsCardsHTML;
    }

    // Add quick replies if available
    if (message.quickReplies && message.quickReplies.length > 0) {
        let quickRepliesHTML = '<div class="quick-replies">';
        message.quickReplies.forEach(reply => {
            quickRepliesHTML += `<button class="quick-reply-btn">${reply}</button>`;
        });
        quickRepliesHTML += '</div>';
        messageContent += quickRepliesHTML;
    }

    messageElement.innerHTML = messageContent;
    chatMessagesElement.appendChild(messageElement);

    // Add event listeners to property cards
    attachPropertyEventListeners(message);

    // Add event listeners to quick reply buttons
    attachQuickReplyListeners(messageElement);
}

function createPropertyCard(property) {
    console.log('Received property data:', property);

    let priceDisplay = property.price;
    console.log('Initial price:', priceDisplay);

    // Check if property is marked as favorite
    const isFavorite = userFavorites[currentSessionId]?.includes(property.id);
    console.log('Is favorite:', isFavorite);

    const heartClass = isFavorite ? 'fas' : 'far';
    console.log('Heart class:', heartClass);

    // Convert price to Cr format if it's in dollars
    if (property.price.includes('$')) {
        console.log('Price in dollars detected, converting...');
        const numericPrice = parseFloat(property.price.replace(/[^0-9.]/g, ''));
        console.log('Extracted numeric price:', numericPrice);
        const priceInCr = (numericPrice * 75 / 10000000).toFixed(2);
        console.log('Converted price in Cr:', priceInCr);
        priceDisplay = `₹${priceInCr} Cr`;
    }

    // Construct BHK info
    const bhkInfo = `${property.bedrooms} BHK ${property.type}`;
    console.log('BHK info:', bhkInfo);

    // Generate a random distance (for testing purposes)
    const distance = (Math.random() * 5).toFixed(1);
    console.log('Random distance:', distance);

    // Construct the HTML for the property card
    const cardHTML = `
        <div class="property-card modern-card" data-property-id="${property.id}">
            <div class="property-image-container">
                <img src="https://png.pngtree.com/png-vector/20230822/ourmid/pngtree-line-home-icon-isolated-on-white-vector-png-image_6851024.png" alt="${property.title}" class="property-image">
                <div class="distance-marker">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${distance} kms</span>
                    <span class="distance-text">away</span>
                </div>
                <div class="favorite-button">
                    <i class="${heartClass} fa-heart"></i>
                </div>
                <div class="attach-button" title="Attach to chat">
                    <i class="fas fa-paperclip"></i>
                    <span class="attach-text">Attach</span>
                </div>
            </div>
            <div class="property-info-modern">
                <div class="property-header">
                    <h3 class="property-title">${property.title}</h3>
                </div>
                <div class="property-types-grid">
                    <div class="property-type-item">
                    <div class="property-subtitle"> ${property.address.split(',')[0]}'s ${property.bedrooms}.${property.bathrooms} BHK Flats</div>
                        <div class="property-type-price">₹${priceDisplay}</div>
                    </div>
                </div>
                <div class="property-additional-info">
                    <div class="info-item">
                        <span class="info-label">Price:</span>
                        <span class="info-value">₹17 K/sq.ft</span>
                    </div>
                    <span class="info-separator">•</span>
                    <div class="info-item">
                        <span class="info-label">Sizes:</span>
                        <span class="info-value">${property.area}</span>
                    </div>
                </div>
                <div class="property-possession">
                    <span class="info-label">Under Construction</span>
                </div>
                <div class="property-possession">
                    <span class="info-label">Possession:</span>
                    <span class="info-value">May, 2031</span>
                </div>
            </div>
        </div>
    `;

    return cardHTML;
}

function createNewsCard(article) {
    const bulletPoints = article.bulletPoints.map(point =>
        `<p class="news-description">${point}</p>`
    ).join('');

    return `
        <div class="news-card">
            <div class="news-image">
                <img src="${article.image}" alt="${article.title}">
            </div>
            <div class="news-content">
                <h5 class="news-title">${article.title}</h5>
                ${bulletPoints}
                <a href="${article.url}" class="news-link">${article.ctaText}</a>
            </div>
        </div>
    `;
}

// Attach event listeners to quick reply buttons
function attachQuickReplyListeners(messageElement) {
    const quickReplyButtons = messageElement.querySelectorAll('.quick-reply-btn');
    quickReplyButtons.forEach(button => {
        button.addEventListener('click', () => {
            sendQuickReply(button.textContent);
        });
    });
}

// Send a quick reply
function sendQuickReply(replyText) {
    messageInputElement.value = replyText;
    sendMessage();
}

// Send message to API
async function sendMessage() {
    let messageText = messageInputElement.value.trim();
    
    // Check if the message is in our property attachment format
    const propertyMatch = messageText.match(/^Property ID or IDs attached \[(.*?)\]( details)?$/i);
    if (propertyMatch) {
        // Extract and clean the property IDs
        const propertyIds = propertyMatch[1]
            .replace(/"/g, '')
            .split(',')
            .map(id => id.trim())
            .filter(id => id !== '');
        
        // Convert to Rasa command format
        if (propertyIds.length > 0) {
            messageText = `/properties ${propertyIds.join(' ')}`;
            
            // If "details" was requested, append it
            if (propertyMatch[2]) {
                messageText += ' details';
            }
        }
    }
    
    if (messageText === '' || !currentSessionId) return;

    // Create user message (show original input in chat)
    const userMessage = {
        sender: 'user',
        message: messageInputElement.value.trim(), // Show original message
        time: getCurrentTime()
    };
    displayMessage(userMessage);

    // Add message to chat history
    if (!chatHistory[currentSessionId]) {
        chatHistory[currentSessionId] = [];
    }
    chatHistory[currentSessionId].push(userMessage);

    // Clear input field
    messageInputElement.value = '';

    try {
        showTypingIndicator();
        const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: currentSessionId,
                message: messageText, // Send the converted command
                stream: true,
                input_channel: "webchat",
                metadata: { "sender": currentSessionId }
            })
        });

        if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

        const botResponses = await response.json();
        removeTypingIndicator();

        if (botResponses && botResponses.length > 0) {
            const responseTime = (Date.now() - typingStartTime) / 1000;
            for (const botResponse of botResponses) {
                const formattedBotMessage = {
                    sender: 'bot',
                    message: botResponse.text || '',
                    time: getCurrentTime(),
                    properties: botResponse.custom?.properties || [],
                    newsArticle: botResponse.custom?.articles || [],
                    quickReplies: botResponse.buttons?.map(b => b.title) || [],
                    responseTime: responseTime
                };
                displayMessage(formattedBotMessage);
                chatHistory[currentSessionId].push(formattedBotMessage);
            }
        } else {
            const emptyResponseMessage = {
                sender: 'bot',
                message: "I'm sorry, I couldn't process your request at the moment.",
                time: getCurrentTime()
            };
            displayMessage(emptyResponseMessage);
            chatHistory[currentSessionId].push(emptyResponseMessage);
        }
        scrollToBottom();
        await fetchAndApplySavedFilters();
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        const errorMessage = {
            sender: 'bot',
            message: "Sorry, there was an error processing your request. Please try again later.",
            time: getCurrentTime()
        };
        displayMessage(errorMessage);
        chatHistory[currentSessionId].push(errorMessage);
        scrollToBottom();
    }
}
// Create new session
async function createNewSession() {
    const newSessionId = `session-${Date.now()}`;
    const newSession = {
        id: newSessionId,
        headText: "New Property Search",
        lastMessage: "Session started",
        lastMessageTime: getCurrentTime(),
        filters: JSON.parse(JSON.stringify(filterData)),
        status: "active"
    };

    // Add to sessions list
    sessions.unshift(newSession);
    chatHistory[newSessionId] = [];
    userFavorites[newSessionId] = [];

    // Select the new session
    selectSession(newSessionId);
    populateSessionList();
    updateSavedPropertiesCount();
}

// Event listeners
function setupEventListeners() {
    sendMessageBtnElement.addEventListener('click', sendMessage);
    messageInputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('newSessionBtn').addEventListener('click', createNewSession);

    // Tab switching
    document.getElementById('filtersTab').addEventListener('click', () => switchTab('filters'));
    document.getElementById('otherTab').addEventListener('click', () => switchTab('other'));
}

// Utility functions
function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function scrollToBottom() {
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
}

function showTypingIndicator() {
    typingStartTime = Date.now();

    const typingElement = document.createElement('div');
    typingElement.className = 'message message-bot typing-indicator';
    typingElement.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <div class="typing-timer">0.0s</div>
        </div>
    `;

    chatMessagesElement.appendChild(typingElement);
    scrollToBottom();

    // Start timer update
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - typingStartTime) / 1000;
        const timerElement = typingElement.querySelector('.typing-timer');
        if (timerElement) {
            timerElement.textContent = `${elapsed.toFixed(1)}s`;
        }
    }, 100);
}

// Update removeTypingIndicator function
function removeTypingIndicator() {
    clearInterval(timerInterval);
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) typingIndicator.remove();
}

/**
 * Sets up filter event listeners for real-time updates
 */
function setupFilterListeners() {
    // Add filter change listener
    window.addEventListener('filterChange', (e) => {
        const botResponse = {
            sender: 'bot',
            message: e.detail,
            time: getCurrentTime()
        };

        if (currentSessionId) {
            if (!chatHistory[currentSessionId]) {
                chatHistory[currentSessionId] = [];
            }
            chatHistory[currentSessionId].push(botResponse);
            displayMessage(botResponse);
        }
    });

    // Add manual filter applied listener
    window.addEventListener('manualFilterApplied', handleManualFilterApplied);
}

/**
 * Handles when filters are manually applied by the user
 * @param {CustomEvent} e - The event containing filter details
 */
function handleManualFilterApplied(e) {
    if (currentSessionId) {
        // Create and display user message
        const userMessage = {
            sender: 'user',
            message: e.detail,
            time: getCurrentTime()
        };

        // Add message to chat history
        if (!chatHistory[currentSessionId]) {
            chatHistory[currentSessionId] = [];
        }
        chatHistory[currentSessionId].push(userMessage);
        displayMessage(userMessage);
        scrollToBottom();

        // Persist filters to current session
        const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
        if (sessionIndex > -1) {
            sessions[sessionIndex].filters = getAppliedFilters();
        }

        // Send the filter text to Rasa
        const filterText = e.detail.replace("I've selected these filters: ", "");
        simulateNaturalLanguageFilter(filterText);
    }
}

async function simulateNaturalLanguageFilter(filterText) {
    if (!currentSessionId) return;

    // Show typing indicator immediately
    showTypingIndicator();

    try {
        const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: currentSessionId,
                message: filterText,
                stream: true,
                input_channel: "webchat",
                metadata: {}
            })
        });

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const botResponses = await response.json();
        removeTypingIndicator();

        if (botResponses && botResponses.length > 0) {
            const responseTime = (Date.now() - typingStartTime) / 1000;
            for (const botResponse of botResponses) {
                const formattedBotMessage = {
                    sender: 'bot',
                    message: botResponse.text || '',
                    time: getCurrentTime(),
                    properties: botResponse.custom?.properties || [],
                    newsArticle: botResponse.custom?.articles || [],
                    quickReplies: botResponse.buttons?.map(b => b.title) || [],
                    responseTime: responseTime,
                };

                displayMessage(formattedBotMessage);
                chatHistory[currentSessionId].push(formattedBotMessage);
                scrollToBottom();
            }

            // Persist filters to current session
            const sessionIndex = sessions.findIndex(s => s.id === currentSessionId);
            if (sessionIndex > -1) {
                sessions[sessionIndex].filters = getAppliedFilters();


            }

            await fetchAndApplySavedFilters();
        } else {
            const emptyResponse = {
                sender: 'bot',
                message: "I found some properties matching your criteria",
                time: getCurrentTime(),
                properties: getFilteredProperties(getAppliedFilters())
            };
            displayMessage(emptyResponse);
            chatHistory[currentSessionId].push(emptyResponse);
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error sending filters:', error);
        removeTypingIndicator();

        const errorMessage = {
            sender: 'bot',
            message: "Sorry, I couldn't process those filters. Please try again.",
            time: getCurrentTime()
        };
        displayMessage(errorMessage);
        chatHistory[currentSessionId].push(errorMessage);
        scrollToBottom();
    }
}

function attachPropertyEventListeners(message) {
    if (message.properties) {
        message.properties.forEach(property => {
            const propertyElement = document.querySelector(`.property-card[data-property-id="${property.id}"]`);

            if (propertyElement) {
                // Update favorites check to use current session's data
                const isFavorite = userFavorites[currentSessionId]?.includes(property.id);
                const heartClass = isFavorite ? 'fas' : 'far';

                // Initialize favorite button
                const favoriteBtn = propertyElement.querySelector('.favorite-button');
                if (favoriteBtn) {
                    const heartIcon = favoriteBtn.querySelector('i');
                    if (heartIcon) {
                        heartIcon.className = `${heartClass} fa-heart`;
                    }

                    // Favorite button click handler
                    favoriteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const heartIcon = e.currentTarget.querySelector('i');
                        const isCurrentlyFavorited = heartIcon.classList.contains('fas');

                        // Optimistic UI update
                        heartIcon.classList.toggle('fas');
                        heartIcon.classList.toggle('far');

                        try {
                            let success;
                            if (isCurrentlyFavorited) {
                                success = await removeFavoriteFromDB(property.id);
                            } else {
                                const currentFilters = getAppliedFilters();
                                success = await saveFavoriteToDB(property.id, currentFilters);
                            }

                            if (!success) {
                                // Revert UI if API call failed
                                heartIcon.classList.toggle('fas');
                                heartIcon.classList.toggle('far');
                                return;
                            }

                            // Update favorites in memory
                            if (isCurrentlyFavorited) {
                                userFavorites[currentSessionId] = userFavorites[currentSessionId].filter(id => id !== property.id);
                            } else {
                                if (!userFavorites[currentSessionId]) userFavorites[currentSessionId] = [];
                                if (!userFavorites[currentSessionId].includes(property.id)) {
                                    userFavorites[currentSessionId].push(property.id);
                                }
                            }

                            // Update all instances of this property in chat
                            document.querySelectorAll(`.property-card[data-property-id="${property.id}"]`).forEach(card => {
                                const btnIcon = card.querySelector('.favorite-button i');
                                if (btnIcon) {
                                    btnIcon.className = isCurrentlyFavorited ? 'far fa-heart' : 'fas fa-heart';
                                }
                            });

                            updateSavedPropertiesCount();
                        } catch (error) {
                            console.error('Error updating favorite:', error);
                            // Revert UI on error
                            heartIcon.classList.toggle('fas');
                            heartIcon.classList.toggle('far');
                        }
                    });
                }

                // Initialize attach button
                const attachBtn = propertyElement.querySelector('.attach-button');
                if (attachBtn) {
                    attachBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const propertyId = propertyElement.getAttribute('data-property-id');
                        
                        // Get current IDs from input
                        let currentIds = [];
                        const inputText = messageInputElement.value.trim();
                        
                        // Extract IDs if the format matches
                        const match = inputText.match(/attached \[(.*?)\]/);
                        if (match && match[1]) {
                            currentIds = match[1].split(',').map(id => id.trim().replace(/["']/g, '')).filter(id => id !== '');
                        } else if (inputText) {
                            // If there's existing text but not in our format, preserve it
                            return;
                        }
                        
                        // Toggle property ID in the list
                        if (currentIds.includes(propertyId)) {
                            // Remove if already exists
                            currentIds = currentIds.filter(id => id !== propertyId);
                            attachBtn.querySelector('i').classList.remove('text-primary');
                        } else {
                            // Add if not exists
                            currentIds.push(propertyId);
                            attachBtn.querySelector('i').classList.add('text-primary');
                        }
                        
                        // Update input field with new format
                        if (currentIds.length > 0) {
                            messageInputElement.value = `Property ID attached ["${currentIds.join('", "')}"]`;
                        } else {
                            messageInputElement.value = '';
                        }
                        
                        // Highlight all attach buttons for this property
                        document.querySelectorAll(`.property-card[data-property-id="${property.id}"] .attach-button i`)
                            .forEach(icon => {
                                if (currentIds.includes(propertyId)) {
                                    icon.classList.add('text-primary');
                                } else {
                                    icon.classList.remove('text-primary');
                                }
                            });
                    });

                    // Set initial state if this property is already in the input
                    const inputText = messageInputElement.value;
                    const match = inputText.match(/attached \[(.*?)\]/);
                    if (match && match[1]) {
                        const currentIds = match[1].split(',').map(id => id.trim().replace(/["']/g, '')).filter(id => id !== '');
                        if (currentIds.includes(property.id)) {
                            attachBtn.querySelector('i').classList.add('text-primary');
                        }
                    }
                }

                // Property card click handler
                propertyElement.addEventListener('click', () => {
                    showPropertyDetails(property.id);
                });
            }
        });
    }
}

async function showPropertyDetails(propertyId) {
    console.log('Showing property details for:', propertyId);
    // Fetch property details from the API or cache
    const property = await getPropertyDetails(propertyId);
    console.log('Property details:', property);
    if (!property) {
        console.error('Property not found');
        return;
    }

    // Show the right panel on mobile
    if (window.innerWidth < 768) {
        rightPanelElement.style.transform = 'translateX(0)';
    }

    // Generate property modal content
    propertyModalTitleElement.textContent = property.title;
    propertyModalBodyElement.innerHTML = `
        <div class="property-modal-image-gallery">
            <div class="property-image-container">
                <img src="https://media.lordicon.com/icons/wired/gradient/63-home.gif" class="property-image" alt="Property">
            </div>
            </div>

        <div class="property-basic-info">
            <h3 class="property-price">${property.price}</h3>
            <p class="property-address mb-2"><i class="fas fa-map-marker-alt"></i> ${property.address}</p>
            <div class="property-stats">
                <div class="stat-item">
                    <i class="fas fa-bed"></i>
                    <span>${property.bedrooms} Bedrooms</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-bath"></i>
                    <span>${property.bathrooms} Bathrooms</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-expand"></i>
                    <span>${property.area}</span>
                </div>
            </div>
        </div>

        <div class="property-description">
            <h4>Description</h4>
            <p>${property.description}</p>
        </div>

        <div class="property-amenities">
            <h4>Amenities</h4>
            <div class="amenities-grid">
                ${property.amenities.map(amenity => `
                    <div class="amenity-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${amenity}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="property-agent-info">
            <h4>Listing Agent</h4>
            <div class="agent-card">
                <img src="${property.agent.avatar}" alt="${property.agent.name}" class="agent-avatar">
                <div class="agent-details">
                    <h5>${property.agent.name}</h5>
                    <p class="agent-title">${property.agent.title}</p>
                    <p class="agent-contact">
                        <i class="fas fa-phone"></i> ${property.agent.phone}<br>
                        <i class="fas fa-envelope"></i> ${property.agent.email}
                    </p>
                </div>
            </div>
        </div>
    `;

    // Initialize the carousel if it exists
    const carouselElement = document.getElementById('propertyImagesCarousel');
    if (carouselElement) {
        new bootstrap.Carousel(carouselElement, {
            interval: 5000, // Rotate every 5 seconds
            wrap: true // Loop through images
        });
    }

    // Check if modal is initialized before showing
    if (propertyModalInstance) {
        propertyModalInstance.show();
    } else {
        console.error('Modal not initialized, trying emergency initialization');
        // Emergency initialization
        try {
            propertyModalInstance = new bootstrap.Modal(document.getElementById('propertyDetailModal'));
            propertyModalInstance.show();
        } catch (error) {
            console.error('Emergency modal initialization failed:', error);
            alert('Could not show property details. Please try again.');
        }
    }

   
}



// Property cache to avoid redundant API calls
let propertyCache = {};

/**
 * Fetches property details from the API or returns cached data
 * @param {string} propertyId - The ID of the property to fetch
 * @returns {Promise<Object>} - The property details
 */
async function getPropertyDetails(propertyId) {
    // Return cached data if available
    if (propertyCache[propertyId]) {
        return propertyCache[propertyId];
    }

    try {
        // Fetch property details from the API
        const response = await fetch(`${API_BASE}/api/properties/${propertyId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch property details: ${response.statusText}`);
        }

        const property = await response.json();

        // Cache the property details
        propertyCache[propertyId] = property;

        return property;
    } catch (error) {
        console.error('Error fetching property details:', error);
        return null;
    }
}

function transformSavedFilters(apiFilters) {
    const transformed = JSON.parse(JSON.stringify(filterData)); // Clone base filter structure
    apiFilters.forEach(savedFilter => {
        const section = transformed[savedFilter.type];
        if (section) {
            if (section.type === "chips") {
                section.options.forEach(opt => {
                    opt.enabled = savedFilter.value.includes(opt.name);
                });
            } else if (section.type === "range") {
                // Handle range values if needed
            }
        }
    });
    return transformed;
}

// Helper function to fetch and apply saved filters
async function fetchAndApplySavedFilters() {
    if (!currentSessionId) return;

    try {
        const response = await fetch(`${API_BASE}/api/sessions/${currentSessionId}/filters`);
        const { filters: savedFilters } = await response.json();

        // Transform API filters format to match UI filter structure
        const transformedFilters = transformSavedFilters(savedFilters);
        loadUserFilters(transformedFilters);
    } catch (error) {
        console.error('Error refreshing filters:', error);
    }
}

// Add new tab switching function
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}TabContent`).classList.add('active');

    // Initialize accordion if showing saved properties
    if (tabName === 'other') {
        displaySavedFavorites();
    }
    updateSavedPropertiesCount(); 
}

// Favorite API endpoints
const FAVORITE_API = `${API_BASE}/api/favorites`;

/**
 * Save property to favorites with current filters
 * @param {string} propertyId - ID of property to favorite
 * @param {object} filters - Current applied filters
 * @returns {Promise<boolean>} - True if successful
 */
async function saveFavoriteToDB(propertyId, filters) {
    try {
        const response = await fetch(FAVORITE_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: currentSessionId,
                propertyId,
                filters: JSON.stringify(filters),
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) throw new Error('Failed to save favorite');
        return true;
    } catch (error) {
        console.error('Error saving favorite:', error);
        showFavoriteError('Failed to save property to favorites');
        return false;
    }
}

/**
 * Remove property from favorites
 * @param {string} propertyId - ID of property to remove
 * @returns {Promise<boolean>} - True if successful
 */
async function removeFavoriteFromDB(propertyId) {
    try {
        const response = await fetch(`${FAVORITE_API}/${propertyId}?sessionId=${currentSessionId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to remove favorite');
        return true;
    } catch (error) {
        console.error('Error removing favorite:', error);
        showFavoriteError('Failed to remove property from favorites');
        return false;
    }
}

/**
 * Load user's favorite properties
 * @param {string} sessionId - Current session ID
 * @returns {Promise<Array>} - Array of favorite property IDs
 */
async function loadFavoritesFromDB(sessionId) {
    try {
        const response = await fetch(`${FAVORITE_API}?sessionId=${sessionId}`);

        if (!response.ok) throw new Error('Failed to load favorites');
        const data = await response.json();
        return data.map(fav => fav.propertyId);
    } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
    }
}

async function displaySavedFavorites() {
    const accordion = document.getElementById('savedPropertiesAccordion');
    if (!accordion) return;

    try {
        const response = await fetch(`${FAVORITE_API}?sessionId=${currentSessionId}`);
        const favorites = await response.json();

        // Group favorites by their filters
        const groupedFavorites = groupFavoritesByFilters(favorites);

        // Clear existing accordion items
        accordion.innerHTML = '';

        // Create accordion items for each filter group
        Object.keys(groupedFavorites).forEach((filterKey, index) => {
            const accordionId = `filterAccordion-${index}`;
            const headerId = `filterHeader-${index}`;

            // Create accordion item
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item filter-accordion-item';
            accordionItem.innerHTML = `
                <h2 class="accordion-header" id="${headerId}">
                    <button class="accordion-button collapsed" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#${accordionId}" 
                            aria-expanded="false" aria-controls="${accordionId}">
                        ${formatFiltersDisplay(JSON.parse(filterKey))}
                    </button>
                </h2>
                <div id="${accordionId}" class="accordion-collapse collapse" 
                     aria-labelledby="${headerId}" data-bs-parent="#savedPropertiesAccordion">
                    <div class="accordion-body">
                        <div class="saved-properties-grid" data-filter-key="${filterKey}">
                            <div class="loading-spinner">
                                <i class="fas fa-spinner fa-spin"></i> Loading properties...
                            </div>
                        </div>
                    </div>
                </div>
            `;

            accordion.appendChild(accordionItem);

            // Load properties for this group
            loadPropertiesForGroup(filterKey, groupedFavorites[filterKey], accordionId);
        });

        // Initialize Bootstrap accordion if not already initialized
        if (window.bootstrap && window.bootstrap.Collapse) {
            new bootstrap.Collapse(document.getElementById('savedPropertiesAccordion'), {
                toggle: false
            });
        }

    } catch (error) {
        console.error('Error loading saved properties:', error);
        accordion.innerHTML = `
            <div class="alert alert-danger">
                Error loading saved properties. Please try again.
            </div>
        `;
    }
}

async function loadPropertiesForGroup(filterKey, favorites, accordionId) {
    const grid = document.querySelector(`#${accordionId} .saved-properties-grid`);
    if (!grid) return;

    try {
        const properties = await Promise.all(
            favorites.map(fav => getPropertyDetails(fav.propertyId))
        );

        grid.innerHTML = properties
            .filter(p => p)
            .map(property => createPropertyBanner(property))
            .join('');

        // Add event listeners
        properties.forEach(property => {
            const element = document.querySelector(`.property-banner[data-property-id="${property.id}"]`);
            if (element) {
                // Click handler for banner
                element.addEventListener('click', () => {
                    showPropertyDetails(property.id);
                });

                // Favorite button handler
                const favButton = element.querySelector('.favorite-button-banner');
                if (favButton) {
                    favButton.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const heartIcon = e.currentTarget.querySelector('i');
                        await handleFavoriteToggle(property.id, heartIcon);
                    });
                }
            }
        });

    } catch (error) {
        console.error('Error loading properties for group:', error);
        grid.innerHTML = `
            <div class="alert alert-warning">
                Could not load some properties. Please refresh.
            </div>
        `;
    }
}

// Helper functions remain the same as before
function groupFavoritesByFilters(favorites) {
    return favorites.reduce((groups, fav) => {
        const filterKey = JSON.stringify(JSON.parse(fav.filters));
        if (!groups[filterKey]) groups[filterKey] = [];
        groups[filterKey].push(fav);
        return groups;
    }, {});
}

function formatFiltersDisplay(filters) {
    return filters.map(f =>
        `${f.section}: ${Array.isArray(f.option) ? f.option.join(', ') : f.option}`
    ).join('; ');
}
function createPropertyBanner(property) {
    const isFavorite = userFavorites[currentSessionId]?.includes(property.id);
    const heartClass = isFavorite ? 'fas' : 'far';

    // Convert price if needed
    let priceDisplay = property.price;
    if (property.price.includes('$')) {
        const numericPrice = parseFloat(property.price.replace(/[^0-9.]/g, ''));
        priceDisplay = `₹${(numericPrice * 75).toLocaleString()}`;
    }

    return `
        <div class="property-banner" data-property-id="${property.id}">
            <div class="banner-content">
                <h3 class="banner-title">${property.title}</h3>
                <p class="banner-subtitle">${property.bedrooms}.${property.bathrooms} BHK ${property.type}</p>
                <div class="banner-details">
                    <span class="banner-price">${priceDisplay}</span>
                    <span>Avg. Price: ₹17 K/sq.ft</span>
                </div>
            </div>
            <button class="favorite-button-banner">
                <i class="${heartClass} fa-heart"></i>
            </button>
        </div>
    `;
}

// Add this helper function
async function handleFavoriteToggle(propertyId, heartIcon) {
    const isCurrentlyFavorited = heartIcon.classList.contains('fas');

    // Optimistic UI update
    heartIcon.classList.toggle('fas');
    heartIcon.classList.toggle('far');

    try {
        let success;
        if (isCurrentlyFavorited) {
            success = await removeFavoriteFromDB(propertyId);
        } else {
            const currentFilters = getAppliedFilters();
            success = await saveFavoriteToDB(propertyId, currentFilters);
        }

        if (!success) {
            // Revert UI if API call failed
            heartIcon.classList.toggle('fas');
            heartIcon.classList.toggle('far');
            return;
        }

        // Update favorites in memory
        if (isCurrentlyFavorited) {
            userFavorites[currentSessionId] = userFavorites[currentSessionId].filter(id => id !== propertyId);
        } else {
            if (!userFavorites[currentSessionId]) userFavorites[currentSessionId] = [];
            if (!userFavorites[currentSessionId].includes(propertyId)) {
                userFavorites[currentSessionId].push(propertyId);
            }
        }

        // Update all instances of this property
        document.querySelectorAll(`.property-banner[data-property-id="${propertyId}"] .favorite-button-banner i`)
            .forEach(icon => {
                icon.className = isCurrentlyFavorited ? 'far fa-heart' : 'fas fa-heart';
            });

        // Add this after updating all instances
        if (document.getElementById('otherTab').classList.contains('active')) {
            await displaySavedFavorites();
            
        }
        updateSavedPropertiesCount(); 
    } catch (error) {
        console.error('Error updating favorite:', error);
        heartIcon.classList.toggle('fas');
        heartIcon.classList.toggle('far');
    }
}

// Add this function to update the count
function updateSavedPropertiesCount() {
    const count = userFavorites[currentSessionId]?.length || 0;
    const tabButton = document.getElementById('otherTab');
    if (!tabButton) return; 
    let badge = tabButton.querySelector('.badge-notification');
  
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge-notification';
      tabButton.appendChild(badge);
    }
  
    badge.textContent = count;
    badge.style.display = count > 0 ? 'block' : 'none';
  }