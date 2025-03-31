// This file contains the Text-to-Speech (TTS) management functionality for the chatbot
// ttsManager.js
// Module for handling Text-to-Speech functionality

// Import the audio unlock utilities module for handling browser audio restrictions
import { AudioUnlockUtils } from './audioUnlockUtils.js';
// Import shared text content for different languages
import { texts } from '../shared.js';
// Import functions to show/hide the thinking indicator in the chat interface
import { appendThinkingIndicator, removeThinkingIndicator } from '../chatinterface.js';

// Helper function to determine the current language of the application
function getCurrentLanguage() {
  // Get the language from the HTML document's lang attribute, defaulting to French if not set
  const lang = document.documentElement.lang || 'fr';
  // Return the language if it's supported (French, English, or Spanish), otherwise default to French
  return ['fr', 'en', 'es'].includes(lang) ? lang : 'fr';
}

// Main Text-to-Speech Manager object that handles all TTS-related functionality
export const TTSManager = {
  // Function to request text-to-speech conversion from the server
  async requestTTS(text) {
    // Log the length of the text being processed
    console.log('[TTS] Requesting TTS for text length:', text.length);
    
    try {
      // Send a POST request to the TTS API endpoint
      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      // Check if the response was successful
      if (!ttsResponse.ok) {
        // Log and throw an error if the server returned an error status
        console.error('[TTS] Server error:', ttsResponse.status, await ttsResponse.text());
        throw new Error(`TTS server error: ${ttsResponse.status}`);
      }
      
      // Verify that the response contains audio content
      const contentType = ttsResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('audio/')) {
        // Log and throw an error if the content type is not audio
        console.error('[TTS] Invalid content type:', contentType);
        throw new Error('Invalid audio response');
      }
      
      // Convert the response to a blob (binary data)
      const audioBlob = await ttsResponse.blob();
      // Log information about the received audio blob
      console.log('[TTS] Audio blob received:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Check if the audio blob is empty
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio blob');
      }
      
      // Create a URL for the audio blob that can be used by the audio player
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      // Log and rethrow any errors that occurred during the process
      console.error('[TTS] Error:', error);
      throw error;
    }
  },
  
  // Function to clean and format text before sending it to TTS
  cleanTextForTTS(text) {
    // Replace HTML line break tags with actual line breaks
    let cleanText = text.replace(/<br\s*\/?>/gi, '\n');
    // Remove all other HTML tags
    cleanText = cleanText.replace(/<[^>]*>/g, '');
    
    // Replace special formatting tags with appropriate spacing
    cleanText = cleanText.replace(/<small-break>/g, '\n');
    // Remove markdown-style bold formatting
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove all emoji characters from the text
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu, '');
    
    // Clean up whitespace while preserving line breaks
    cleanText = cleanText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    // Add pauses after sentence endings
    cleanText = cleanText.replace(/([.!?])\s+/g, '$1, ');
    
    return cleanText;
  },
  
  // Function to handle speaking a message using TTS
  async speakMessage(msgDiv, text, audioPlaybackManager) {
    try {
      // Stop any currently playing audio before starting new audio
      audioPlaybackManager.stopCurrentlyPlayingAudio(false);
      
      // Update the vocal button UI to show loading state
      const vocalButton = msgDiv.querySelector('.vocal-button');
      if (vocalButton) {
        vocalButton.classList.add('loading');
        vocalButton.innerHTML = '';
        const loadingImg = new Image();
        loadingImg.src = 'assets/loading.png';
        loadingImg.className = 'vocal-icon';
        vocalButton.appendChild(loadingImg);
      }
      
      // Store the text to be spoken
      const textToSpeak = text;
      
      // Ensure audio system is unlocked before proceeding
      console.log('[TTS] Before unlockAudio call in speakMessage');
      await AudioUnlockUtils.unlockAudio();
      console.log('[TTS] After unlockAudio call in speakMessage');
      
      // Get the audio URL for the text
      const audioUrl = await this.requestTTS(textToSpeak);
      
      // Store the audio URL in the message div's dataset
      msgDiv.dataset.audioUrl = audioUrl;
      
      // Play the audio using the audio playback manager
      await audioPlaybackManager.playMessageAudio(msgDiv, audioUrl);
      
      return audioUrl;
    } catch (error) {
      // Log any errors that occurred during the process
      console.error('[TTS] Error speaking message:', error);
      
      // Reset the vocal button to its default state
      const vocalButton = msgDiv.querySelector('.vocal-button');
      if (vocalButton) {
        vocalButton.classList.remove('loading');
        vocalButton.innerHTML = '';
        const vocalImg = new Image();
        vocalImg.src = 'assets/vocal.png';
        vocalImg.className = 'vocal-icon';
        vocalButton.appendChild(vocalImg);
      }
      
      throw error;
    }
  },
  
  // Function to get both text and audio response from the bot
  async getBotResponseWithAudio(question) {
    // First get the text response from the chat API
    let answer;
    try {
      // Send the question to the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language: getCurrentLanguage() })
      });
      
      // Check if the response was successful
      if (!response.ok) {
        console.error('[TTS] Chat response not OK:', response.status);
        throw new Error('Chat API error');
      }
      
      // Parse the JSON response
      const data = await response.json();
      answer = data.answer;
    } catch (error) {
      // Log and rethrow any errors from the chat API
      console.error('[TTS] Error getting chat response:', error);
      throw error;
    }
    
    // Then get the audio for the response
    try {
      // Convert the text response to audio
      const audioUrl = await this.requestTTS(answer);
      return { answer, audioUrl };
    } catch (error) {
      // Log errors but still return the text answer even if audio fails
      console.error('[TTS] Error getting audio for response:', error);
      return { answer, audioUrl: null };
    }
  },
  
  // Function to automatically read bot messages
  autoReadBotMessage(msgDiv, text, isWelcome = false, audioPlaybackManager) {
    // Check various conditions to prevent duplicate audio processing
    if (msgDiv.dataset.audioUrl || 
        msgDiv.dataset.audioHandled === 'true' || 
        msgDiv.dataset.autoReadTriggered === 'true' ||
        window.pendingBotResponse) {
      console.log(`[Client] Skipping auto-read because audio is already being handled: ${msgDiv.dataset.messageId}`);
      return;
    }
    
    // Mark this message as being auto-read
    msgDiv.dataset.autoReadTriggered = 'true';
    
    // Log the start of auto-reading
    console.log(`[Client] Auto-reading enabled for message with ${text.length} characters`);
    
    // Unlock the audio system immediately
    AudioUnlockUtils.unlockAudio();
    
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      // Double-check that the message hasn't been handled by another process
      if (msgDiv.dataset.audioUrl || msgDiv.dataset.audioHandled === 'true' || window.pendingBotResponse) {
        console.log(`[Client] Cancelling auto-read because audio was handled by another process during delay: ${msgDiv.dataset.messageId}`);
        return;
      }
      
      // Log the start of the actual auto-read process
      console.log(`[Client] Triggering auto-read for message: ${msgDiv.dataset.messageId}`);
      
      // Use speakMessage to handle the TTS
      this.speakMessage(msgDiv, isWelcome ? texts[getCurrentLanguage()].welcomeText : text, audioPlaybackManager)
        .catch(err => {
          console.error('[Client] Auto-read failed:', err);
        });
    }, 20);
  },
  
  // Function to get bot response and audio with UI updates
  async getBotResponseAndAudioWithUI(question, appendMessageFunction, audioPlaybackManager) {
    // Show the thinking indicator in the UI
    appendThinkingIndicator();
    
    try {
      // Get both text and audio response from the bot
      const { answer, audioUrl } = await this.getBotResponseWithAudio(question);
      
      // Remove the thinking indicator
      removeThinkingIndicator();
      
      // Create and append the bot's message to the chat interface
      const botMessageDiv = appendMessageFunction(answer, 'bot');
      
      // Generate a unique ID for the message if one doesn't exist
      if (!botMessageDiv.dataset.messageId) {
        botMessageDiv.dataset.messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      // Mark the message as being handled by this function
      botMessageDiv.dataset.audioHandled = 'true';
      
      // Mark the message as being auto-read
      botMessageDiv.dataset.autoReadTriggered = 'true';
      
      // If we have audio, attach and play it
      if (audioUrl) {
        // Store the audio URL in the message div
        botMessageDiv.dataset.audioUrl = audioUrl;
        
        // Play the audio using the audio playback manager
        await audioPlaybackManager.playMessageAudio(botMessageDiv, audioUrl);
      }
      
      return botMessageDiv;
    } catch (error) {
      // Log any errors that occurred
      console.error('[API] Error in bot response with audio:', error);
      console.error('[API] Error stack:', error.stack);
      // Remove the thinking indicator
      removeThinkingIndicator();
      // Show an error message to the user
      appendMessageFunction(texts[getCurrentLanguage()].errorText, 'bot');
    }
  }
}; 