// apicommunication.js - This file handles communication with the server to get responses from the chatbot
// Bringing in tools and functions from other files that we'll need
import { appendMessage, texts, currentLanguage } from './shared.js'; // Getting functions to add messages to the chat and language text
import { AudioManager } from './audiomanager.js'; // Getting tools to handle sound and speech
import { appendThinkingIndicator, removeThinkingIndicator } from './chatinterface.js'; // Getting functions to show/hide the "thinking" animation
import { SettingsManager } from './settings.js'; // Getting tools to handle user settings
import { UtilityManager } from './utility.js'; // Getting helpful utility functions

// This line writes a message to the developer console to confirm this file has been loaded
console.log('apicommunication.js module loaded');

// This function sends the user's question to the server and gets back the bot's answer
export async function getBotResponse(question) {
    // If there's no question or it's just spaces, stop here and don't do anything
    if (!question || question.trim() === '') return;

    // Set a flag to prevent automatically reading the response out loud (this will be handled separately)
    window.pendingBotResponse = true;
    // Show a "thinking" animation so the user knows the bot is working
    appendThinkingIndicator();

    try {
        // Send the user's question to the server using the fetch command (like sending a letter and waiting for a reply)
        const response = await fetch('/api/chat', {
            method: 'POST', // This is like saying "I'm sending you information" rather than just asking for it
            headers: { 'Content-Type': 'application/json' }, // This tells the server we're sending JSON data (a specific format)
            body: JSON.stringify({ // Convert our data into a string format the server can understand
                question: question, // The user's question
                language: currentLanguage // What language the user is using
            })
        });

        // If the server had a problem (didn't respond with "OK")
        if (!response.ok) {
            // Hide the "thinking" animation
            removeThinkingIndicator();
            // Add an error message to the chat
            appendMessage(texts[currentLanguage].errorText, 'bot');
            // Clear the flag that was preventing auto-reading
            window.pendingBotResponse = false;
            // Stop here, don't continue
            return;
        }

        // Convert the server's response from JSON format to a JavaScript object we can use
        const data = await response.json();
        // Hide the "thinking" animation
        removeThinkingIndicator();
        // Add the bot's answer to the chat and remember which message div was created
        const botMessageDiv = appendMessage(data.answer, 'bot');
        
        // Clear the flag that was preventing auto-reading, now that we've added the message
        window.pendingBotResponse = false;

        // Note: Automatic text-to-speech was removed from here
        // It's now handled by different functions (getBotResponseAndAudio or the shared.js appendMessage function)
    } catch (err) {
        // If any errors happened during this process:
        // Hide the "thinking" animation
        removeThinkingIndicator();
        // Add an error message to the chat
        appendMessage(texts[currentLanguage].errorText, 'bot');
        // Clear the flag that was preventing auto-reading
        window.pendingBotResponse = false;
    }
}

// This function gets a bot response AND speaks it out loud
export async function getBotResponseAndAudio(question) {
    // Set a flag to prevent automatically reading the response (we'll handle it ourselves)
    window.pendingBotResponse = true;
    
    try {
        // Use the AudioManager's text-to-speech functionality to get the response and play it
        // We pass in the appendMessage function so it can add the message to the chat
        return await AudioManager.TTS.getBotResponseAndAudioWithUI(question, appendMessage);
    } finally {
        // No matter what happens (success or error), clear the flag when we're done
        window.pendingBotResponse = false;
    }
}