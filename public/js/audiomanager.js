// AudioManager.js - This is the main file that handles all sound and voice features of the chatbot
// This file brings together all the different audio-related components

// Bringing in tools and functions from other files that we'll need
import { AudioUnlockUtils, EventSystem } from './audio/audioUnlockUtils.js'; // Tools to make sure audio can play on mobile devices
import { TTSManager } from './audio/ttsManager.js'; // Tools to handle text-to-speech (computer voice)
import { RecordingManager } from './audio/recordingManager.js'; // Tools to handle voice recording
import { AudioPlaybackManager } from './audio/audioPlaybackManager.js'; // Tools to play audio files

// Create an AudioManager object that will contain all the audio-related functions
export const AudioManager = {
  // Shared audio context for all components
  sharedAudioContext: null,
  
  // This function sets up all the audio components when the app starts
  init: function() {
    // This line writes a message to the developer console that we're setting up audio
    console.log('Initializing Audio Manager');
    
    // Create a single shared AudioContext for the entire application
    this.createSharedAudioContext();
    
    if (this.sharedAudioContext) {
      console.log('[AudioManager:init] AudioContext state:', this.sharedAudioContext.state);
    }
    
    // Save references to all the audio tools so we can use them easily
    this.audioUnlockUtils = AudioUnlockUtils; // Tools to make audio work on mobile
    this.ttsManager = TTSManager; // Text-to-speech tools
    this.recordingManager = RecordingManager; // Voice recording tools
    this.audioPlaybackManager = AudioPlaybackManager; // Audio playback tools
    
    // Make the shared AudioContext available to all components
    window.sharedAudioContext = this.sharedAudioContext;
    
    // Set up a structure that works with older code that might still be used
    this.TTS = {
      // This function gets a bot response and plays it as audio
      getBotResponseAndAudioWithUI: (question, appendMessageFunction) => {
        return this.ttsManager.getBotResponseAndAudioWithUI(question, appendMessageFunction, this.audioPlaybackManager);
      },
      
      // This function speaks a message out loud
      speakMessage: (msgDiv, text) => {
        // Mark the message as already being handled to prevent it from being read twice
        if (msgDiv && !msgDiv.dataset.audioHandled) {
          msgDiv.dataset.audioHandled = 'true';
        }
        return this.ttsManager.speakMessage(msgDiv, text, this.audioPlaybackManager);
      },
      
      // This function automatically reads bot messages out loud if the setting is enabled
      autoReadBotMessage: (msgDiv, text, isWelcome) => {
        return this.ttsManager.autoReadBotMessage(msgDiv, text, isWelcome, this.audioPlaybackManager);
      }
    };
    
    // Initialize the recording manager if it has an initialize function
    if (typeof this.recordingManager.initialize === 'function') {
      this.recordingManager.initialize({
        voiceButton: document.getElementById('voiceInput'), // The button to start voice recording
        userInput: document.getElementById('userInput'), // The text input field
        recordingUI: document.querySelector('.recording-ui') // The recording interface
      });
    }
    
    // Initialize the audio playback manager if it has an initialize function
    if (typeof this.audioPlaybackManager.initialize === 'function') {
      this.audioPlaybackManager.initialize();
    }
    
    // Set up a handler for the first time the user interacts with the page
    // This is more reliable than trying to enable audio right at startup
    this.audioUnlockUtils.setupFirstInteractionHandler();
    
    // Only try to unlock audio if the user has already interacted with the page
    if (document.querySelector('body.had-user-interaction') !== null) {
      this.audioUnlockUtils.unlockAudio();
    } else {
      // Write a message to the console that we'll wait for user interaction
      console.log('[AudioManager] Deferring audio unlock until user interaction');
    }
    
    // Set up event listeners that will respond to user actions
    this.setupGlobalEventListeners();
    
    // Return this object so it can be used in other places
    return this;
  },
  
  // Create a shared AudioContext for the entire application
  createSharedAudioContext: function() {
    if (!this.sharedAudioContext) {
      try {
        this.sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[AudioManager:createSharedAudioContext] Created shared AudioContext with state:', this.sharedAudioContext.state);
        
        // Resume the context when user interacts with the page
        const resumeAudioContext = () => {
          if (this.sharedAudioContext && this.sharedAudioContext.state === 'suspended') {
            this.sharedAudioContext.resume().then(() => {
              console.log('[AudioManager] SharedAudioContext resumed successfully');
            }).catch(err => {
              console.error('[AudioManager] Error resuming SharedAudioContext:', err);
            });
          }
        };
        
        // These events indicate user interaction
        const userEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
        userEvents.forEach(event => {
          document.addEventListener(event, resumeAudioContext, { once: true });
        });
      } catch (e) {
        console.error('[AudioManager] Error creating shared AudioContext:', e);
      }
    }
    return this.sharedAudioContext;
  },
  
  // Get the shared AudioContext
  getSharedAudioContext: function() {
    const context = this.sharedAudioContext || this.createSharedAudioContext();
    if (context) {
      console.log('[AudioManager:getSharedAudioContext] AudioContext state:', context.state);
    }
    return context;
  },
  
  // This function sets up listeners for events that happen on the page
  setupGlobalEventListeners: function() {
    if (this.sharedAudioContext) {
      console.log('[AudioManager:setupGlobalEventListeners] AudioContext state:', this.sharedAudioContext.state);
    }
    
    // Set up a listener for when the page visibility changes (like when you switch tabs)
    EventSystem.register(document, 'visibilitychange', () => {
      // Handle what happens when the page visibility changes
      if (document.hidden) {
        // If the page is hidden (user switched to another tab or app), stop any playing audio
        this.audioPlaybackManager.stopCurrentlyPlayingAudio(false);
      } else {
        // If the page becomes visible again, try to unlock audio
        this.audioUnlockUtils.unlockAudio();
      }
    });
    
    // Set up a listener for when the user is about to leave the page
    EventSystem.register(window, 'beforeunload', () => {
      // Clean up resources before the page unloads
      this.cleanup();
    });
    
    // Set up a special listener for mobile devices to unlock audio on first touch
    EventSystem.register(document, 'touchstart', () => {
      this.audioUnlockUtils.unlockAudio(true);
    }, { once: true }); // This option makes the listener run only once
  },
  
  // These are public methods that other parts of the application can use
  
  // Text-to-speech methods
  // This function gets the computer-generated speech without playing it
  getTTS: function(text) {
    return this.ttsManager.requestTTS(text);
  },
  
  // This function speaks text out loud
  speakTTS: function(text, msgDiv) {
    // Find the message element if not provided (use the last bot message)
    const messageElement = msgDiv || document.querySelector('.message.bot:last-child');
    return this.ttsManager.speakMessage(messageElement, text, this.audioPlaybackManager);
  },
  
  // This function gets a bot response and plays it as audio (for compatibility with older code)
  getBotResponseAndAudioWithUI: function(question, appendMessageFunction) {
    return this.ttsManager.getBotResponseAndAudioWithUI(question, appendMessageFunction, this.audioPlaybackManager);
  },
  
  // Audio playback methods
  // This function plays an audio file for a specific message
  playMessageAudio: function(msgDiv, audioUrl) {
    return this.audioPlaybackManager.playMessageAudio(msgDiv, audioUrl);
  },
  
  // This function pauses audio that's currently playing
  pauseAudio: function(audio) {
    return this.audioPlaybackManager.pauseAudio(audio);
  },
  
  // This function resumes playing paused audio
  resumeAudio: function(msgDiv, audioUrl) {
    return this.audioPlaybackManager.resumeAudio(msgDiv, audioUrl);
  },
  
  // This function stops any audio that's currently playing
  stopCurrentlyPlayingAudio: function() {
    return this.audioPlaybackManager.stopCurrentlyPlayingAudio();
  },
  
  // This function updates the play/pause buttons on a message
  updateAudioControls: function(messageElement) {
    return this.audioPlaybackManager.updateAudioControls(messageElement);
  },
  
  // Audio unlocking methods (to make audio work on mobile devices)
  // This function tries to unlock audio playback
  unlockAudio: function(forceAttempt) {
    return this.audioUnlockUtils.unlockAudio(forceAttempt);
  },
  
  // This function is for compatibility with application.js
  unlockAutoplay: function() {
    return this.audioUnlockUtils.unlockAudio(true, true);
  },
  
  // Voice recording methods
  // This function starts recording the user's voice
  startRecording: function() {
    return this.recordingManager.startRecording();
  },
  
  // This function stops recording the user's voice
  stopRecording: function(shouldKeepTranscript) {
    return this.recordingManager.stopRecording(shouldKeepTranscript);
  },
  
  // Event handling methods
  // This function adds an event listener (a function that responds to user actions)
  addEventListener: function(element, type, callback, options) {
    return EventSystem.register(element, type, callback, options);
  },
  
  // This function removes an event listener
  removeEventListener: function(element, type, callback) {
    return EventSystem.unregister(element, type, callback);
  },
  
  // This function cleans up resources when the page is closed
  cleanup: function() {
    // Stop any audio that's currently playing
    this.audioPlaybackManager.stopCurrentlyPlayingAudio();
    
    // Stop recording if it's active
    if (this.recordingManager.isRecording) {
      this.recordingManager.stopRecording(false);
    }
    
    // Remove all event listeners to prevent memory leaks
    EventSystem.unregisterAll();
    
    // This line writes a message to the developer console that cleanup is complete
    console.log('Audio Manager cleaned up');
  }
};

// Also make AudioManager available globally for older code
window.AudioManager = AudioManager;

// Initialize AudioManager when the page has fully loaded
document.addEventListener('DOMContentLoaded', function() {
  window.AudioManager.init();
});

// Make RecordingManager globally available for other parts of the code
window.RecordingManager = RecordingManager; 