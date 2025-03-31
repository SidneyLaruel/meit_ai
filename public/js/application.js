// application.js - This is the main file that starts and controls the chatbot application
// Bringing in tools and functions from other files that we'll need
import { initModals } from './modal.js'; // Getting functions to initialize popup windows
import { LanguageManager } from './language.js'; // Getting tools to handle different languages
import { AudioManager } from './audiomanager.js'; // Getting tools to handle sounds and voice
import { updateUIText, texts, currentLanguage, appendMessage } from './shared.js'; // Getting shared functions and text
import { SettingsManager } from './settings.js'; // Getting tools to handle user settings
import { setupKeyboardSubmit, onLanguageChange as onLanguageChange_chat } from './chatinterface.js'; // Getting chat interface functions
import { UtilityManager } from './utility.js'; // Getting helpful utility functions

// This line writes a message to the developer console to confirm this file has been loaded
console.log('application.js module loaded');

// When the webpage has completely loaded all its HTML elements, run the initApp function
document.addEventListener('DOMContentLoaded', () => {
    // This line writes a message to the developer console that the page is fully loaded
    console.log('DOMContentLoaded in application.js');
    // Start the application
    initApp();
});

// This function sets up and starts all parts of the chatbot application
function initApp() {
    // This line writes a message to the developer console that we're starting the app
    console.log('initApp() called');

    // Set up language first - it's most important because all text depends on it
    LanguageManager.initialize();
    
    // Then set up other parts of the application in a specific order
    initModals(); // Set up popup windows
    SettingsManager.initialize(); // Set up user settings
    setupKeyboardSubmit(); // Set up the ability to press Enter to send messages
    checkBrowserCompatibility(); // Check if the user's browser works well with our app
    
    // Set up audio last to avoid problems with different parts of the code depending on each other
    AudioManager.init();
    setupAutoplayUnlock(); // Set up a system to allow audio to play automatically
}

// This function checks if the user's web browser is compatible with our application
function checkBrowserCompatibility() {
    // Find the div where messages are displayed
    const messagesDiv = document.getElementById('messages');

    // If the user is using Opera browser, show a warning message
    if (UtilityManager.isOpera()) {
        // Wait 1 second before showing the warning
        setTimeout(() => {
            // Create a new div element for the warning
            const browserWarning = document.createElement('div');
            // Give it special styling classes
            browserWarning.className = 'message bot browser-warning';
            // Add the warning text in the user's language
            browserWarning.innerHTML = `<span>${texts[currentLanguage].operaWarning}</span>`;
            // Add this warning div to the messages area
            messagesDiv.appendChild(browserWarning);
            // Scroll to the bottom so the user sees the warning
            UtilityManager.scrollToBottom(true);
        }, 1000);
    }
}

// This function sets up a way to unlock audio playing when the user interacts with the page
function setupAutoplayUnlock() {
    // We don't unlock right away, we wait for the user to do something on the page
    // This prevents errors with automatic audio playing before the user interacts
    
    // List of all the ways a user might interact with the page
    const interactionEvents = ['touchstart', 'touchend', 'click', 'keydown', 'scroll', 'mousemove'];
    
    // This function runs once when the user interacts with the page
    const unlockOnce = () => {
        // Add a class to the body to show we've had user interaction
        document.body.classList.add('had-user-interaction');
        // Try to unlock audio playing
        AudioManager.unlockAutoplay();
        // Remove all the event listeners so this only happens once
        interactionEvents.forEach(event => {
            document.removeEventListener(event, unlockOnce);
        });
    };

    // Add listeners for all the different ways a user might interact with the page
    interactionEvents.forEach(event => {
        document.addEventListener(event, unlockOnce);
    });
}

// This function updates everything when the language changes
export function handleLanguageChange() {
    // This line writes a message to the developer console that the language is changing
    console.log('handleLanguageChange in application.js');
    updateUIText(); // Update all the text in the user interface
    onLanguageChange_modal(); // Update text in popup windows
    SettingsManager.onLanguageChange(); // Update text in settings
    LanguageManager.onLanguageChange(); // Update language-specific components
    onLanguageChange_chat(); // Update text in the chat interface
}

// Bringing in a specific function from the modal.js file
import { onLanguageChange as onLanguageChange_modal } from './modal.js';

// Set up a function that can be called from HTML when the user changes language
window.changeLanguage = function() {
    LanguageManager.changeLanguage(); // Change the actual language setting
    handleLanguageChange(); // Update everything with the new language
};