// chatinterface.js - This file handles all the chat interface elements and interactions
// Bringing in tools and functions from other files that we'll need
import { appendMessage, texts, currentLanguage } from './shared.js'; // Getting functions to add messages and text in different languages
import { AudioManager } from './audiomanager.js'; // Getting tools to handle sound and speech
import { getBotResponse, getBotResponseAndAudio } from './apicommunication.js'; // Getting functions to communicate with the chatbot
import { SettingsManager } from './settings.js'; // Getting tools to handle user settings
import { UtilityManager } from './utility.js'; // Getting helpful utility functions

// This line writes a message to the developer console to confirm this file has been loaded
console.log('chatinterface.js module loaded');

// Creating variables to store references to important elements on the page
let form; // The form that contains the chat input
let userInput; // The text box where users type their messages
let sendButton; // The button users click to send their message
let voiceButton; // The button users click to use voice input
let messagesDiv; // The area where all chat messages are displayed
// Creating a variable to store the loading image so we don't have to load it multiple times
let cachedLoadingImg = null;

// Variables for handling the resizing of the text input box
let multiLineMinHeight = 0; // Minimum height for multi-line messages
let initialSingleLineHeight; // Starting height of the input box for a single line
let resizeTimeout; // Timer to prevent resizing too frequently

// Initialize global variables for UI elements
let messagesList;
let scrollAnchor;
let botMessageTemplate;
let botMsgCount = 0; // Counter for bot messages to help with message IDs
let userMsgCount = 0; // Counter for user messages to help with message IDs
let isPending = false; // Flag to track if we're waiting for a response
let isTyping = false; // Flag to track if the bot is "typing"
let lastUserMessage = null; // Store the last user message for API retry
let retryTimeoutId = null; // Timeout ID for retry mechanism

// When the webpage has completely loaded, initialize the chat interface
document.addEventListener('DOMContentLoaded', () => {
    initializeChatInterface();
});

// Function to handle input in the text box
function handleInput() {
    // Clear any previous resize timers
    clearTimeout(resizeTimeout);
    
    // Set a new timer to resize the input box after a short delay
    resizeTimeout = setTimeout(() => {
        // Get the line height from the CSS
        const lineHeight = parseInt(getComputedStyle(userInput).lineHeight);
        // Reset the height to auto so we can measure the content
        userInput.style.height = 'auto';
        // Calculate the new height based on the content or minimum height
        const newHeight = Math.max(
            userInput.scrollHeight, // Height of the content
            lineHeight + parseInt(getComputedStyle(userInput).paddingTop) +
            parseInt(getComputedStyle(userInput).paddingBottom) // Minimum height with padding
        );
        // Set the new height of the input box
        userInput.style.height = `${newHeight}px`;
    }, 10); // Wait 10 milliseconds before resizing
    
    // Update which buttons are shown
    updateButtonState();
}

// This function sets up all the elements and behaviors of the chat interface
function initializeChatInterface() {
    // This line writes a message to the developer console that we're initializing the chat interface
    console.log('DOMContentLoaded in chatinterface.js');
    // Finding all the important elements on the page and storing them in our variables
    form = document.getElementById('chatForm'); // The form element
    userInput = document.getElementById('userInput'); // The text input box
    sendButton = document.getElementById('sendButton'); // The send button
    voiceButton = document.getElementById('voiceInput'); // The voice input button
    messagesDiv = document.getElementById('messages'); // The messages area
    scrollAnchor = document.getElementById('scrollAnchor');
    botMessageTemplate = document.getElementById('botMessageTemplate');

    // Remember the initial height of the input box for a single line of text
    initialSingleLineHeight = userInput.clientHeight;

    // Loading the spinning/loading image ahead of time so it's ready when needed
    cachedLoadingImg = new Image(); // Create a new image object
    cachedLoadingImg.src = 'assets/loading.png'; // Set the image source
    cachedLoadingImg.alt = 'Chargement...'; // Set alternative text for accessibility
    cachedLoadingImg.className = 'loading-icon'; // Set the CSS class for styling

    // Update the placeholder text in the input box based on the current language
    updatePlaceholderText();
    // Show/hide the appropriate buttons based on whether there's text in the input box
    updateButtonState();
    // Set up all the event listeners for the input box
    setupInputEventListeners();
    // Set up the event listener for the form submission
    setupFormEventListener();

    // Prevent context menu on voice input button (mic icon)
    if (voiceButton) {
        // Prevent context menu for the button and its contents
        voiceButton.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }, { capture: true });
        
        // Handle touchstart to prevent default behavior
        voiceButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            // Start a timer to handle long press if needed
            const longPressTimer = setTimeout(() => {
                // Optional long press behavior
            }, 500);
            
            // Store the timer so we can clear it on touchend
            voiceButton._longPressTimer = longPressTimer;
        }, { passive: false, capture: true });
        
        // Handle touchend to trigger click
        voiceButton.addEventListener('touchend', (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            // Clear any long press timer
            if (voiceButton._longPressTimer) {
                clearTimeout(voiceButton._longPressTimer);
                voiceButton._longPressTimer = null;
            }
            
            // Properly trigger the click event instead of calling methods directly
            console.log('DEBUG: Triggering click event on voiceButton');
            // Create and dispatch a proper click event
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            voiceButton.dispatchEvent(clickEvent);
            
        }, { passive: false, capture: true });
        
        // Apply to image inside button
        const buttonImg = voiceButton.querySelector('img');
        if (buttonImg) {
            buttonImg.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }, { capture: true });
            
            buttonImg.addEventListener('touchstart', (event) => {
                event.preventDefault();
                event.stopPropagation();
                // Prevent bubbling to parent
                event.cancelBubble = true;
            }, { passive: false, capture: true });
            
            buttonImg.addEventListener('touchend', (event) => {
                event.preventDefault();
                event.stopPropagation();
                // Prevent bubbling to parent and trigger directly
                event.cancelBubble = true;
                
                // Properly trigger the click event on the parent button
                console.log('DEBUG: Triggering click event from button image');
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                voiceButton.dispatchEvent(clickEvent);
            }, { passive: false, capture: true });
            
            // Prevent default image actions
            buttonImg.style.webkitTouchCallout = 'none';
            buttonImg.style.webkitUserSelect = 'none';
            buttonImg.style.userSelect = 'none';
            buttonImg.setAttribute('draggable', 'false');
        }
        
        // Add CSS to prevent long-press context menu
        voiceButton.style.webkitTouchCallout = 'none';
        voiceButton.style.webkitUserSelect = 'none';
        voiceButton.style.userSelect = 'none';
    }

    // Set up input handler for user input
    userInput.addEventListener('input', handleInput);
}

// This function decides whether to show the send button or voice button
function updateButtonState() {
    // If the input box is empty (or just spaces)
    if (userInput.value.trim() === "") {
        // Hide the send button
        sendButton.style.display = 'none';
        // Show the voice button
        voiceButton.style.display = 'inline-block';
    } else {
        // If there's text, show the send button
        sendButton.style.display = 'inline-block';
        // Hide the voice button
        voiceButton.style.display = 'none';
    }
}

// This function sets up all the events that happen when interacting with the input box
function setupInputEventListeners() {
    // When the user types in the input box
    userInput.addEventListener('input', () => {
        // Clear any previous resize timers to prevent too many resizes
        clearTimeout(resizeTimeout);
        // Set a new timer to resize the input box after a short delay
        resizeTimeout = setTimeout(() => {
            // Get the line height from the CSS
            const lineHeight = parseInt(getComputedStyle(userInput).lineHeight);
            // Reset the height to auto so we can measure the content
            userInput.style.height = 'auto';
            // Calculate the new height based on the content or minimum height
            const newHeight = Math.max(
                userInput.scrollHeight, // Height of the content
                lineHeight + parseInt(getComputedStyle(userInput).paddingTop) +
                parseInt(getComputedStyle(userInput).paddingBottom) // Minimum height with padding
            );
            // Set the new height of the input box
            userInput.style.height = `${newHeight}px`;
        }, 10); // Wait 10 milliseconds before resizing
        // Update which buttons are shown
        updateButtonState();
    });

    // When the input box gets focus (user clicks on it)
    userInput.addEventListener("focus", () => {
        // Trigger the input event to resize the box correctly
        userInput.dispatchEvent(new Event("input"));
    });

    // When the input box loses focus (user clicks elsewhere)
    userInput.addEventListener('blur', () => {
        // Scroll to the bottom of the chat after a short delay
        setTimeout(() => UtilityManager.scrollToBottom(), 100);
    });
}

// This function sets up what happens when the chat form is submitted
function setupFormEventListener() {
    // When the form is submitted (user clicks send or presses Enter)
    form.addEventListener('submit', (e) => {
        // Prevent the default form submission behavior (which would reload the page)
        e.preventDefault();
        // This line writes a message to the developer console that the form was submitted
        console.log('Form submit event triggered');
        
        // Check if we're currently processing a voice recording with auto-transcribe turned off
        if (window.RecordingManager && window.RecordingManager.processingTranscript) {
            // If the RecordingManager is processing a recording and auto-transcribe is off
            const autoTranscribe = window.RecordingManager.SettingsManager.getSetting('autoTranscribeVoice');
            if (!autoTranscribe) {
                // Don't submit the form in this case (let the recording process handle it)
                console.log('Blocking form submission during voice transcript processing in non-autoTranscribe mode');
                return;
            }
            // If auto-transcribe is on, we can continue with the submission
            console.log('Voice transcript with autoTranscribe ON, continuing with submission');
        }
        
        // Get the user's question, removing any extra spaces at the beginning or end
        const question = userInput.value.trim();
        // This line writes a message to the developer console with the question
        console.log('Form submit handler with question:', question);
        
        // If the question is empty, don't do anything
        if (!question) {
            console.log('Empty question, not submitting form');
            return;
        }
        // Add the user's message to the chat
        appendMessage(question, 'user');
        // Clear the input box
        userInput.value = '';
        // Reset the height of the input box
        userInput.style.height = '40px';
        // Update which buttons are shown
        updateButtonState();

        // Check if the "always read out loud" setting is enabled
        const alwaysReadOutLoud = SettingsManager.getSetting('alwaysReadOutLoud');
        if (alwaysReadOutLoud) {
            // If it's enabled, get the bot's response and read it out loud
            getBotResponseAndAudio(question);
        } else {
            // Otherwise, just get the bot's response without audio
            getBotResponse(question);
        }
    });
}

// Special handling for mobile keyboards that can resize the viewport
if (window.visualViewport) {
    // Remember the last height of the viewport
    let lastViewportHeight = window.visualViewport.height;
    // When the viewport resizes (like when the keyboard appears or disappears)
    window.visualViewport.addEventListener('resize', () => {
        // If the viewport got taller (keyboard closed)
        if (window.visualViewport.height > lastViewportHeight) {
            // Scroll to the bottom after a short delay
            setTimeout(() => UtilityManager.scrollToBottom(), 300);
        }
        // Update the last known viewport height
        lastViewportHeight = window.visualViewport.height;
    });
}

// This function adds a loading/thinking indicator to show the bot is working
export function appendThinkingIndicator() {
    // Only add the indicator if one doesn't already exist
    if (!document.querySelector('.thinking-indicator')) {
        // Create a new div for the thinking indicator
        const thinkingDiv = document.createElement('div');
        // Give it the right CSS class
        thinkingDiv.className = 'thinking-indicator';

        // Use the image we loaded earlier, or create a new one if needed
        const loadingImg = cachedLoadingImg ? cachedLoadingImg.cloneNode(true) : document.createElement('img');
        if (!cachedLoadingImg) {
            // If we don't have a cached image, set up a new one
            loadingImg.src = 'assets/loading.png';
            loadingImg.alt = 'Chargement...';
            loadingImg.className = 'loading-icon';
        }

        // Add the loading image to the thinking indicator div
        thinkingDiv.appendChild(loadingImg);
        // Add the thinking indicator to the messages area
        messagesDiv.appendChild(thinkingDiv);
        // Scroll to the bottom so the user can see the indicator
        UtilityManager.scrollToBottom();
    }
}

// This function removes the thinking indicator when the bot has responded
export function removeThinkingIndicator() {
    // Find the thinking indicator
    const thinkingDiv = document.querySelector('.thinking-indicator');
    // Remove it if it exists (the ? means "only if it exists")
    thinkingDiv?.remove();
}

// This function updates the interface when the language changes
export function onLanguageChange() {
    // Update the placeholder text and other language-specific elements
    updatePlaceholderText();
}

// This function updates text elements based on the current language
function updatePlaceholderText() {
    // Update the placeholder text in the input box
    if (userInput) {
        userInput.placeholder = texts[currentLanguage].questionPlaceholder;
    }
    // Update the disclaimer text
    const disclaimerElement = document.getElementById('disclaimer');
    if (disclaimerElement) {
      disclaimerElement.textContent = texts[currentLanguage].disclaimerText;
    }
    // Update any browser warning messages
    const browserWarning = document.querySelector('.browser-warning span');
    if (browserWarning) {
      browserWarning.textContent = texts[currentLanguage].operaWarning;
    }
}

// This function sets up keyboard shortcuts for submitting the form
export function setupKeyboardSubmit() {
    // Only set up keyboard shortcuts on non-mobile devices
    if (!UtilityManager.isMobileDevice()) {
        // When the user presses a key in the input box
        userInput.addEventListener('keydown', function(event) {
            // If they press Enter without holding Shift
            if (event.key === "Enter" && !event.shiftKey) {
                // Prevent the default behavior (which would add a new line)
                event.preventDefault();
                // Trigger the form submission
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        });
    }
}

// This function checks if the user is on a mobile device
function isMobileDevice() {
    // Check if the user agent string contains mobile device identifiers
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// This function scrolls the chat window to the bottom
export function scrollToBottom() {
    // Set the scroll position to the maximum height
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}