// This file manages everything related to voice recording, including using the microphone and converting speech to text
// recordingManager.js
// Module for handling voice recording and speech recognition functionality
//
// Note: For Android devices, we intentionally avoid focusing the input field after
// pasting a transcript when autoTranscribeVoice is off, to prevent the keyboard
// from automatically appearing. This behavior is different from other platforms.

// Import helper tools from other files
import { AudioUnlockUtils, EventSystem } from './audioUnlockUtils.js';
// Import system for handling different languages
import { LanguageManager } from '../language.js';
// Import text messages for different languages
import { texts } from '../shared.js';
// Import general utility functions
import { UtilityManager } from '../utility.js';
// Import functions to show/hide the "thinking" animation in the chat
import { appendThinkingIndicator, removeThinkingIndicator } from '../chatinterface.js';

// Function to determine what language the user is currently using
// Helper function to get current language
function getCurrentLanguage() {
  // Get the language from the HTML document, defaulting to French if not set
  const lang = document.documentElement.lang || 'fr';
  // Return the language if it's one we support (French, English, Spanish), otherwise default to French
  return ['fr', 'en', 'es'].includes(lang) ? lang : 'fr';
}

// Function to check if the user is on an Android device
// Helper function to detect Android devices
function isAndroidDevice() {
  // Look for "Android" in the browser's information string
  return /Android/i.test(navigator.userAgent);
}

// Function to check if the user is using Microsoft Edge browser
// Helper function to detect Edge browser
function isEdgeBrowser() {
  // Look for "Edg/" in the browser's information string
  return /Edg\//.test(navigator.userAgent);
}

// The main object that contains all the voice recording functionality
export const RecordingManager = {
  // Variables to keep track of the current state and settings
  // State
  // The system that converts speech to text
  recognition: null,
  // Alternative recording system for browsers that don't support speech recognition
  recordRTC: null,
  // Whether we're currently recording audio
  isRecording: false,
  // The connection to the user's microphone
  micStream: null,
  // Special system for processing audio
  audioContext: null,
  // Tool that analyzes audio for the waveform display
  analyser: null,
  // When the recording started (in milliseconds)
  recordingStartTime: 0,
  // A timer that updates the recording duration display
  recordingTimer: null,
  // Whether the user is using Opera browser
  isOpera: !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0 || navigator.userAgent.indexOf('Opera') >= 0,
  // Whether the user's browser supports speech recognition
  speechRecognitionSupported: false,
  // Prevents processing a transcript multiple times
  processingTranscript: false, // Track if we're processing a transcript to prevent duplicate submissions
  // Whether the user is on an Android device
  isAndroid: false, // Flag to track Android devices
  // Whether the user is using Edge browser
  isEdge: false, // Flag to track Edge browser
  
  // References to important elements on the page
  // References to DOM elements
  // The microphone button that starts recording
  voiceButton: null,
  // The text input field where the transcribed speech will appear
  userInput: null,
  // The popup interface that appears while recording
  recordingUI: null,
  // The visual display that shows sound waves while recording
  waveformCanvas: null,
  // The button to cancel recording
  cancelButton: null,
  // The button to confirm and send the recording
  confirmButton: null,
  // The element that shows how long you've been recording
  durationDisplay: null,
  
  // Information about what languages we support for speech recognition
  // Language support
  SUPPORTED_LANGUAGES: {
    // English settings
    en: {
      // Full name of the language
      name: 'English',
      // The code used by the speech recognition system
      speechLang: 'en-US',
      // Common greeting words to recognize in this language
      shortGreetings: ['hello', 'hi', 'hey']
    },
    // French settings
    fr: {
      // Full name of the language
      name: 'Français',
      // The code used by the speech recognition system
      speechLang: 'fr-FR',
      // Common greeting words to recognize in this language
      shortGreetings: ['bonjour', 'salut']
    },
    // Spanish settings
    es: {
      // Full name of the language
      name: 'Español',
      // The code used by the speech recognition system
      speechLang: 'es-ES',
      // Common greeting words to recognize in this language
      shortGreetings: ['hola', 'buenos dias', 'buenas']
    }
  },
  
  // Small system to save and load user settings
  // Settings helper
  SettingsManager: {
    // Function to get a saved setting
    getSetting: function(key) {
      // Check if the setting is saved as "true" in the browser's storage
      return localStorage.getItem(key) === 'true';
    },
    // Function to save a setting
    setSetting: function(key, value) {
      // Store the value in the browser's storage
      localStorage.setItem(key, value);
    }
  },
  
  // Function to set up the recording manager when the page loads
  // Initialize
  initialize(elements) {
    // Log a message that we're starting initialization
    console.log('RecordingManager initializing with elements:', elements);
    
    // Check if the user is on an Android device
    // Detect Android device
    this.isAndroid = isAndroidDevice();
    // Log whether an Android device was detected
    console.log('[RecordingManager] Android device detected:', this.isAndroid);
    
    // Check if the user is using Microsoft Edge browser
    // Detect Edge browser
    this.isEdge = isEdgeBrowser();
    // Log whether Edge browser was detected
    console.log('[RecordingManager] Edge browser detected:', this.isEdge);
    
    // Save references to important elements on the page
    // Store references to DOM elements
    // Get the microphone button, either from provided elements or find it by ID
    this.voiceButton = elements.voiceButton || document.getElementById('voiceInput');
    // Get the text input field, either from provided elements or find it by ID
    this.userInput = elements.userInput || document.getElementById('userInput');
    // Get the recording interface, either from provided elements or find it by class
    this.recordingUI = elements.recordingUI || document.querySelector('.recording-ui');
    
    // If we found the recording interface, get all the elements inside it
    if (this.recordingUI) {
      // Get the canvas element that shows the audio waveform
      this.waveformCanvas = this.recordingUI.querySelector('.waveform-canvas');
      // Get the button to cancel recording
      this.cancelButton = this.recordingUI.querySelector('.cancel-button');
      // Get the button to confirm and send the recording
      this.confirmButton = this.recordingUI.querySelector('.confirm-button');
      // Get the element that displays the recording duration
      this.durationDisplay = this.recordingUI.querySelector('.duration-display');
      
      // Log whether we found all the necessary elements
      console.log('Recording UI elements found:', {
        waveformCanvas: !!this.waveformCanvas,
        cancelButton: !!this.cancelButton,
        confirmButton: !!this.confirmButton,
        durationDisplay: !!this.durationDisplay
      });
    } else {
      // Log an error if we couldn't find the recording interface
      console.error('[RecordingManager] Recording UI elements not found');
    }
    
    // Set up speech recognition, event listeners, and audio processing
    // Initialize speech recognition and attach event handlers
    this.initSpeechRecognition();
    this.initEventListeners();
    this.initAudioContext();
    
    // Return this object so it can be used by other code
    return this;
  },
  
  // Function to set up speech recognition based on what the browser supports
  // Initialize speech recognition
  initSpeechRecognition() {
    try {
      // For Android, we use a different approach called RecordRTC
      // For Android, we'll use RecordRTC instead of SpeechRecognition
      if (this.isAndroid) {
        // Log that we're using a different approach for Android
        console.log('[RecordingManager] Android device: Using RecordRTC for STT');
        // Mark speech recognition as supported even though we're using an alternative
        // We'll still mark this as supported since we have a fallback
        this.speechRecognitionSupported = true;
        return;
      }
      
      // For non-Android devices, check if the browser supports speech recognition
      // For non-Android: Just check if speech recognition is supported, but don't create an instance yet
      if ((window.SpeechRecognition || window.webkitSpeechRecognition) && !this.isOpera) {
        // Log that speech recognition is supported
        console.log('[RecordingManager] Speech recognition is supported on this browser');
        // Set the flag to indicate support
        this.speechRecognitionSupported = true;
      } else {
        // Log that speech recognition is not supported
        console.log('[RecordingManager] Speech recognition is not supported on this browser');
        // Set the flag to indicate lack of support
        this.speechRecognitionSupported = false;
      }
    } catch (e) {
      // Log any errors that occurred during the check
      console.error("Speech recognition not supported:", e);
      // Set the flag to indicate lack of support
      this.speechRecognitionSupported = false;
    }
  },
  
  // Function to set up all the event handlers (what happens when buttons are clicked)
  // Initialize event listeners
  initEventListeners() {
    // Check if all the necessary buttons exist before continuing
    if (!this.cancelButton || !this.confirmButton || !this.voiceButton) {
      // Log an error if any buttons are missing
      console.error('[RecordingManager] Required buttons not found');
      // Exit the function early if buttons are missing
      return;
    }
    
    // Set up what happens when the cancel button is clicked
    // Recording Event Listeners
    EventSystem.register(this.cancelButton, 'click', () => {
      // If speech recognition is active, stop it
      if (this.recognition) {
        this.recognition.abort();
      }
      // Clear the text input field
      this.userInput.value = '';
      // Trigger an input event to update any UI that depends on the input
      this.userInput.dispatchEvent(new Event('input'));
      // Stop the recording without sending anything
      this.stopRecording(false);
    });

    // Prevent multiple rapid clicks on the confirm button from causing issues
    // Add debounce to prevent multiple submissions
    let confirmClickProcessing = false;
    // Set up what happens when the confirm button is clicked
    EventSystem.register(this.confirmButton, 'click', () => {
      // Log that the confirm button was clicked
      console.log('Confirm button clicked!');
      // If we're already processing a click, ignore this one
      if (confirmClickProcessing) {
        console.log('Ignoring duplicate confirm click');
        return;
      }
      
      // Set the flag to indicate we're processing a click
      confirmClickProcessing = true;
      // Stop recording and send the recorded audio/text
      this.stopRecording(true);
      
      // Reset the flag after a delay to allow for new clicks
      // Reset the flag after a delay to prevent any rare race conditions
      setTimeout(() => {
        confirmClickProcessing = false;
      }, 1000);
    });

    // Set up the Escape key to cancel recording
    // Add Escape key listener for stopping recording
    EventSystem.register(document, 'keydown', (event) => {
      // If the Escape key is pressed while recording
      if (event.key === 'Escape' && this.isRecording) {
        // If speech recognition is active, stop it
        if (this.recognition) {
          this.recognition.abort();
        }
        // Clear the text input field
        this.userInput.value = '';
        // Trigger an input event to update any UI that depends on the input
        this.userInput.dispatchEvent(new Event('input'));
        // Stop recording without sending anything
        this.stopRecording(false);
      }
    });

    // Prevent long-press context menus on the mic button (especially for mobile)
    // Prevent context menu on long-press for mic buttons
    if (this.voiceButton) {
      // Stop the right-click/long-press menu from appearing
      // Prevent context menu from showing on mobile
      this.voiceButton.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        return false;
      });

      // Variables to manage showing a notification about not needing to hold the button
      // Variable to track long press notification
      let holdNotification = null;
      let pressTimer = null;

      // Set up handling for touch events on the mic button
      // Handle touchstart event to prevent default behavior and detect long press
      this.voiceButton.addEventListener('touchstart', (event) => {
        // Prevent the default touch behavior
        event.preventDefault();
        
        // Start recording as soon as the button is touched
        // Start the recording immediately on touch
        this.voiceButton.click();
        
        // Start a timer to show a helpful notification after a short delay
        // Set a timer to show the notification after a short delay (300ms)
        pressTimer = setTimeout(() => {
          // Only create a notification if one doesn't already exist
          // Create hold notification if it doesn't exist
          if (!holdNotification) {
            // Different messages for different languages
            // Messages in different languages
            const tapMessages = {
              'en': 'Simply tap—no need to hold.',
              'fr': 'Appuyez simplement—pas besoin de maintenir.',
              'es': 'Simplemente toque—no necesita mantener presionado.'
            };
            
            // Get the current language
            // Get current language
            const currentLang = getCurrentLanguage();
            // Get the appropriate message for the current language
            const tapMessage = tapMessages[currentLang] || tapMessages['en']; // Default to English if language not found
            
            // Create a new element to display the notification
            // Create hold notification if it doesn't exist
            holdNotification = document.createElement('div');
            // Add a CSS class for styling
            holdNotification.className = 'hold-notification';
            // Set the message text
            holdNotification.textContent = tapMessage;
            // Position the notification absolutely on the page
            holdNotification.style.position = 'absolute';
            // Position it from the bottom of the screen
            holdNotification.style.bottom = '120px'; // Positioned higher than before (was 80px)
            // Center it horizontally
            holdNotification.style.left = '50%';
            // Ensure it's truly centered
            holdNotification.style.transform = 'translateX(-50%)';
            // Give it a dark, semi-transparent background
            holdNotification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            // Make the text white
            holdNotification.style.color = 'white';
            // Add some padding around the text
            holdNotification.style.padding = '8px 16px';
            // Round the corners of the notification
            holdNotification.style.borderRadius = '16px';
            // Set the font size
            holdNotification.style.fontSize = '14px';
            // Make sure it appears above other elements
            holdNotification.style.zIndex = '1000';
            // Add the notification to the page
            document.body.appendChild(holdNotification);
            
            // Automatically hide the notification after 3 seconds
            setTimeout(() => {
              // Only remove it if it still exists
              if (holdNotification && holdNotification.parentNode) {
                // Remove the notification from the page
                holdNotification.parentNode.removeChild(holdNotification);
                // Clear the reference to the notification
                holdNotification = null;
              }
            }, 3000);
          }
        }, 300);
      }, { passive: false });
    
      // Handle what happens when the user stops touching the mic button
      // Handle touchend event to clean up
      this.voiceButton.addEventListener('touchend', (event) => {
        // Prevent the default touch behavior
        event.preventDefault();
        
        // Clear the timer if the touch ends before the notification is shown
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
        
        // No need to trigger click - we already did it on touchstart
      }, { passive: false });
    }

    // Set up what happens when the microphone button is clicked
    EventSystem.register(this.voiceButton, 'click', async () => {
      try {
        // Don't start recording if we're already recording
        // Prevent multiple recording starts
        if (this.isRecording) {
          console.log('[RecordingManager] Already recording, ignoring duplicate start');
          return;
        }
        
        // Reset microphone access if there's a problem with the current connection
        // Reset microphone access if there's an issue with the current stream
        if (this.micStream && !this.micStream.active) {
          console.log('[RecordingManager] Existing micStream is inactive, resetting');
          // Stop all tracks in the microphone stream
          this.micStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (e) {}
          });
          // Clear the reference to the microphone stream
          this.micStream = null;
        }

        // Use the existing microphone stream if it's still active
        // Use the existing active stream if we have one
        if (this.micStream && this.micStream.active) {
          console.log('[RecordingManager] Reusing existing active micStream:', this.micStream.id);
        } else {
          // Reset microphone access completely before requesting it again
          // CRITICAL: Full reset of microphone access on every click
          await this.resetMicrophoneAccess();
          
          // Stop any audio that might be playing before we start recording
          // Force release ALL audio playback resources first
          if (window.AudioManager && window.AudioManager.audioPlaybackManager) {
            console.log('[RecordingManager] Releasing audio resources through AudioManager');
            window.AudioManager.audioPlaybackManager.releaseAudioResources();
          } else if (window.AudioPlaybackManager) {
            console.log('[RecordingManager] Releasing audio resources directly');
            window.AudioPlaybackManager.releaseAudioResources();
          }
          
          // Continue with the recording setup
          // Now continue with regular initialization sequence
          if (!this.speechRecognitionSupported) {
            // For Android, we use a different method
            // For Android, we can try using RecordRTC instead of failing
            if (this.isAndroid) {
              console.log('[RecordingManager] Android device without SpeechRecognition, trying RecordRTC as fallback');
            } else {
              // Show an error message if speech recognition isn't supported
              alert("La reconnaissance vocale n'est pas prise en charge par ce navigateur. Veuillez utiliser Chrome, Edge ou Safari.");
              return;
            }
          }

          // Request access to the user's microphone with optimal settings
          // CRITICAL: Explicitly request microphone access with fresh state ONLY if we don't have an active stream
          console.log('[RecordingManager] Requesting microphone access with fresh state');
          this.micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              // Reduce echo in the audio
              echoCancellation: true,
              // Reduce background noise
              noiseSuppression: true,
              // Automatically adjust audio levels
              autoGainControl: true
            } 
          });
          console.log('[RecordingManager] Successfully obtained micStream:', this.micStream);
        }

        // Set up the audio processing system for handling the microphone input
        // Check for existing audio context before creating a new one
        if (!this.audioContext) {
          // Try to use an existing audio context if available
          if (window.AudioPlaybackManager && window.AudioPlaybackManager.audioContext) {
            console.log('[RecordingManager] Reusing AudioPlaybackManager audio context');
            this.audioContext = window.AudioPlaybackManager.audioContext;
          } else if (window.AudioUnlockUtils && window.AudioUnlockUtils.audioContext) {
            console.log('[RecordingManager] Reusing AudioUnlockUtils audio context');
            this.audioContext = window.AudioUnlockUtils.audioContext;
          } else if (window.sharedAudioContext) {
            console.log('[RecordingManager] Reusing sharedAudioContext');
            this.audioContext = window.sharedAudioContext;
          } else {
            // Create a new audio context if no existing one is available
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[RecordingManager] Created new audioContext:', this.audioContext);
          }
        }
        
        // Create a new audio context if the existing one is closed or closing
        // CRITICAL FIX: Check if audio context is closed or closing and create a new one if needed
        if (this.audioContext && (this.audioContext.state === 'closed' || this.audioContext.state === 'closing')) {
          console.log('[RecordingManager] Found closed/closing audio context, creating a new one');
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          // Update the global reference if it exists
          if (window.sharedAudioContext) {
            window.sharedAudioContext = this.audioContext;
          }
        }
        
        // Log the current state of the audio context
        console.log('[RecordingManager] Audio context state:', this.audioContext ? this.audioContext.state : 'none');
        
        // Create the analyzer for visualizing the audio waveform
        // If the analyzer for visualizing audio isn't available, create a new one
        // IMPROVED: More robust handling of analyser availability
        if (!this.analyser && this.audioContext) {
          console.log('[RecordingManager] Creating new analyser for waveform');
          // Create a new audio analyzer
          this.analyser = this.audioContext.createAnalyser();
          // Set the size of the Fast Fourier Transform (FFT) - affects detail level
          this.analyser.fftSize = 1024;
          // Add smoothing to make the waveform look less jumpy
          this.analyser.smoothingTimeConstant = 0.8;
          
          // Connect the audio source to the analyzer if available
          // If we have a source but no analyser connected, connect them
          if (this.source) {
            try {
              // Only connect if not using Edge browser (which has issues with analyzers)
              // Only connect to analyser if it exists and not in Edge browser
              if (this.analyser && !this.isEdge) {
                this.source.connect(this.analyser);
                console.log('[RecordingManager] Re-connected media stream to analyser for waveform visualization');
              } else {
                console.warn('[RecordingManager] No analyser available to connect to or Edge browser detected');
              }
            } catch (e) {
              console.error('[RecordingManager] Error connecting source to analyser:', e);
            }
          }
        }

        // Connect the microphone input to the audio analyzer
        // Only create the media stream source if we don't already have one
        // or if we're using a new micStream
        if (!this.source || this.source.mediaStream !== this.micStream) {
          // Disconnect any existing source
          if (this.source) {
            try {
              this.source.disconnect();
            } catch (e) {}
          }
          // Create a new media stream source from the microphone
          this.source = this.audioContext.createMediaStreamSource(this.micStream);
          // Connect to the analyzer unless we're on Edge browser
          if (!this.isEdge) {
            this.source.connect(this.analyser);
          } else {
            console.log('[RecordingManager] Edge browser detected, skipping analyser connection');
          }
        }
        
        // Display the recording interface and start the waveform visualization
        // Start the recording UI first
        this.startRecording();
        
        // Handle Android devices differently
        // For Android, we use RecordRTC instead of SpeechRecognition
        if (this.isAndroid) {
          console.log('[RecordingManager] Using RecordRTC for Android');
          return; // We already set up RecordRTC in startRecording
        }
        
        // Set up speech recognition for non-Android devices
        // For non-Android devices, proceed with SpeechRecognition
        // Wait a short time before starting speech recognition
        setTimeout(async () => {
          try {
            // Stop any existing speech recognition
            // First try to stop any existing recognition
            if (this.recognition) {
              try {
                this.recognition.abort();
                this.recognition.stop();
              } catch (e) {
                console.log('Error stopping existing recognition:', e);
              }
            }
            
            // Create a new instance of speech recognition - but don't create a new micStream
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            // Make speech recognition keep listening continuously instead of stopping after one phrase
            this.recognition.continuous = true;
            // Show results as the user speaks, not just at the end of a phrase
            this.recognition.interimResults = true;
            
            // Set the language for speech recognition based on the current user language
            // Set language
            const speechLangs = {
              'fr': 'fr-FR',
              'en': 'en-US',
              'es': 'es-ES'
            };
            this.recognition.lang = speechLangs[getCurrentLanguage()];
            
            // Set up what happens when the speech recognition system detects speech
            // Set up recognition handlers
            this.recognition.onresult = (event) => {
              // Don't process speech if we're not recording anymore
              if (!this.isRecording) {
                console.log('[RecordingManager] Ignoring result - recording stopped');
                return;
              }

              // Combine all the parts of speech into one complete transcript
              const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

              console.log('[RecordingManager] Received transcript:', transcript);

              // Check if automatic transcription is enabled in user settings
              // Check autoTranscribe setting - if ON, don't show in input field at all
              const autoTranscribe = this.SettingsManager.getSetting('autoTranscribeVoice');
              
              // Handle the transcript differently based on user settings
              // Store transcript internally but don't show in input field if autoTranscribe is enabled
              if (this.userInput) {
                if (!autoTranscribe) {
                  // If autoTranscribe is OFF, show transcript in the input field as the user speaks
                  this.userInput.value = transcript;
                  // Position the cursor at the end of the text
                  this.userInput.setSelectionRange(transcript.length, transcript.length);
                  console.log('Updated input value during recording:', transcript);
                } else {
                  // If autoTranscribe is ON, store the transcript internally but don't show it in the input field
                  // This will be used later to send the message automatically
                  this._currentTranscript = transcript;
                  console.log('Storing transcript internally without updating input field:', transcript);
                }
              }
            };

            // Handle errors from the speech recognition system
            this.recognition.onerror = (event) => {
              console.error('[RecordingManager] Speech recognition error:', event.error);
              // For Android, we handle certain errors differently
              // On Android, we don't want to stop recording for certain errors
              if (event.error === 'aborted' && this.isRecording) {
                console.log('[RecordingManager] Ignoring aborted error while recording is active');
                return;
              }
              // Stop recording if there's an error
              this.stopRecording(false);
            };
            
            // Handle what happens when speech recognition ends
            this.recognition.onend = () => {
              console.log('[RecordingManager] Speech recognition ended');
              // If we're still recording when recognition ends, restart it
              // On Android, we need to handle the end event differently
              if (this.isRecording) {
                console.log('[RecordingManager] Recording still active, restarting recognition');
                try {
                  // Wait a short time before restarting speech recognition
                  // Add a small delay before restarting to ensure clean state
                  setTimeout(() => {
                    // Only restart if we're still recording
                    if (this.isRecording) {
                      // Restart the existing speech recognition service
                      this.recognition.start();
                    }
                  }, 100);
                } catch (e) {
                  console.error('[RecordingManager] Error restarting recognition:', e);
                }
              }
            };
            
            // Start the speech recognition system
            // Start the recognition WITHOUT getting a new stream (already obtained above)
            await this.recognition.start();
            console.log('[RecordingManager] Speech recognition started successfully');
            
            // Start drawing the audio waveform visualization
            this.drawWaveform();
          } catch (e) {
            console.error('[RecordingManager] Speech recognition error:', e);
            // If speech recognition is already running, show an error message
            if (e.name === 'InvalidStateError') {
              alert("Le service de reconnaissance vocale est déjà en cours d'exécution. Veuillez rafraîchir la page.");
            } else {
              throw e;
            }
          }
        }, 100); // Small delay to ensure UI is ready
      } catch (error) {
        console.error('Microphone/recognition error:', error);
        // Stop recording if there's an error
        this.stopRecording(false);
        
        // Check the status of the microphone after an error
        // Check mic status after error
        setTimeout(() => this.checkMicrophoneStatus(), 500);
        
        // Show a permission error message if the user denied microphone access
        if (error.name !== 'NotAllowedError') {
          alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
        }
      }
    });
  },
  
  // Set up the audio processing system for recording
  // Initialize audio context for recording
  initAudioContext() {
    if (!this.audioContext) {
      try {
        // Try to use an existing audio context if available
        // Try to use an existing audio context from AudioPlaybackManager or AudioUnlockUtils
        if (window.AudioPlaybackManager && window.AudioPlaybackManager.audioContext) {
          console.log('[RecordingManager] Reusing AudioPlaybackManager audio context in initAudioContext');
          this.audioContext = window.AudioPlaybackManager.audioContext;
        } else if (window.AudioUnlockUtils && window.AudioUnlockUtils.audioContext) {
          console.log('[RecordingManager] Reusing AudioUnlockUtils audio context in initAudioContext');
          this.audioContext = window.AudioUnlockUtils.audioContext;
        } else {
          // Create a new audio context if no existing one is available
          // Create a new audio context only if no existing one is available
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          console.log('[RecordingManager] Created new audioContext in initAudioContext');
        }
        
        // Create the analyzer for visualizing the audio waveform if needed
        // Create analyzer if needed
        if (!this.analyser) {
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 1024;
          this.analyser.smoothingTimeConstant = 0.8;
        }
      } catch (e) {
        console.error('[RecordingManager] Could not create audio context:', e);
      }
    }
  },
  
  // Functions to show and hide the recording user interface
  // UI functions for recording
  showRecordingUI() {
    if (this.recordingUI) {
      // Make the recording interface visible
      this.recordingUI.style.display = 'flex';
      // Add an 'active' class to enable any CSS animations
      this.recordingUI.classList.add('active');
      console.log('Recording UI shown, confirm button visible:', 
                  this.confirmButton && 
                  window.getComputedStyle(this.confirmButton).display !== 'none');
    }
  },

  // Hide the recording interface
  hideRecordingUI() {
    if (this.recordingUI) {
      console.log('Hiding recording UI');
      // Hide the recording interface
      this.recordingUI.style.display = 'none';
      // Remove the 'active' class
      this.recordingUI.classList.remove('active');
      // Remove focus from the input field
      this.userInput.blur();
    }
  },
  
  // Draw the visual representation of sound waves during recording
  // Draw recording waveform visualization
  drawWaveform() {
    if (!this.isRecording || !this.waveformCanvas) {
      console.log('Cannot draw waveform - missing required elements:', {
        isRecording: this.isRecording,
        hasCanvas: !!this.waveformCanvas
      });
      return;
    }

    // For Microsoft Edge browser, use a simpler waveform animation
    // For Edge browser, always use the fallback waveform method
    if (this.isEdge) {
      console.log('[RecordingManager] Using fallback waveform for Edge browser');
      this.drawFallbackWaveform();
      return;
    }

    // If the analyzer for visualizing audio isn't available, create a new one
    // IMPROVED: More robust handling of analyser availability
    if (!this.analyser && this.audioContext) {
      console.log('[RecordingManager] Creating new analyser for waveform');
      // Create a new audio analyzer
      this.analyser = this.audioContext.createAnalyser();
      // Set the size of the Fast Fourier Transform (FFT) - affects detail level
      this.analyser.fftSize = 1024;
      // Add smoothing to make the waveform look less jumpy
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect the audio source to the analyzer if available
      // If we have a source but no analyser connected, connect them
      if (this.source) {
        try {
          // Only connect if not using Edge browser (which has issues with analyzers)
          // Only connect to analyser if it exists and not in Edge browser
          if (this.analyser && !this.isEdge) {
            this.source.connect(this.analyser);
            console.log('[RecordingManager] Re-connected media stream to analyser for waveform visualization');
          } else {
            console.warn('[RecordingManager] No analyser available to connect to or Edge browser detected');
          }
        } catch (e) {
          console.error('[RecordingManager] Error connecting source to analyser:', e);
        }
      }
    }
    
    // If we can't use the analyzer, show a simulated waveform instead
    // If we still don't have an analyser, show a fallback animation
    if (!this.analyser) {
      console.log('[RecordingManager] No analyser available, showing fallback animation');
      this.drawFallbackWaveform();
      return;
    }

    // Get the canvas element where we'll draw the waveform
    const canvas = this.waveformCanvas;
    // Get the 2D drawing context of the canvas
    const ctx = canvas.getContext('2d');
    
    console.log('Drawing waveform on canvas:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      offsetWidth: canvas.offsetWidth,
      offsetHeight: canvas.offsetHeight
    });
    
    // Set the canvas size to match its display size, accounting for high-DPI displays
    // Make sure canvas dimensions are set properly
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    // Scale the context to account for high-DPI displays
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Draw the background of the waveform display
    // Ensure background is drawn immediately
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up the arrays to store audio data from the analyzer
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Function to draw the waveform animation frame by frame
    const draw = () => {
      // Stop drawing if recording has stopped
      if (!this.isRecording) return;

      // Request the next animation frame to create a smooth animation
      this.animationFrameId = requestAnimationFrame(draw);
      // Get the frequency data from the audio analyzer
      this.analyser.getByteFrequencyData(dataArray);

      // Redraw the background for this frame
      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate the width of each bar in the visualization
      const barWidth = (canvas.width / bufferLength) * 4;  
      let x = 0;

      // Draw each bar of the waveform visualization
      for (let i = 0; i < bufferLength; i += 4) {
        // Calculate the average value of 4 frequency bins for smoother visualization
        const average = (dataArray[i] + (dataArray[i + 1] || 0) + (dataArray[i + 2] || 0) + (dataArray[i + 3] || 0)) / 4;
        // Calculate the height of each bar based on the audio level
        const barHeight = (average / 255) * canvas.height;

        // Set the color of the waveform bars
        ctx.fillStyle = '#fff';
        // Center the bars vertically in the canvas
        const y = (canvas.height - barHeight) / 2;
        // Draw the bar with a small gap between bars
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);

        // Move to the position for the next bar
        x += barWidth;
      }
    };

    // Start the waveform animation
    // Start the animation
    draw();
  },
  
  // Alternative waveform animation for browsers that don't support audio analyzers
  // New fallback waveform animation when analyser isn't available
  drawFallbackWaveform() {
    // Don't draw if we're not recording or don't have a canvas
    if (!this.isRecording || !this.waveformCanvas) return;
    
    // Get the canvas element and its drawing context
    const canvas = this.waveformCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set the canvas size to match its display size, accounting for high-DPI displays
    // Make sure canvas dimensions are set properly
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Draw the background of the waveform display
    // Ensure background is drawn immediately
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set parameters for the simulated waveform
    // Animation parameters
    const numBars = 32;
    const barWidth = (canvas.width / numBars) * 0.8;
    const barSpacing = canvas.width / numBars;
    let animationFrame = 0;
    
    console.log('[RecordingManager] Starting fallback waveform animation');
    
    // Create a simulated waveform that looks like real speech
    // Use a more realistic simulation of audio input
    const draw = () => {
      // Stop the animation if recording has stopped
      if (!this.isRecording) {
        console.log('[RecordingManager] Stopping fallback waveform animation');
        return;
      }
      
      // Increment the animation frame counter
      animationFrame++;
      // Request the next animation frame to create a smooth animation
      this.animationFrameId = requestAnimationFrame(draw);
      
      // Redraw the background for this frame
      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw each bar of the simulated waveform
      for (let i = 0; i < numBars; i++) {
        // Use mathematical waves to create a realistic-looking waveform
        // Generate a more realistic waveform simulation
        // Use multiple sine waves with different frequencies and phases
        // This creates a more dynamic, speech-like pattern
        const time = animationFrame * 0.05;
        
        // Base wave - slow oscillation
        let height = Math.sin(time + i * 0.2) * 0.3 + 0.5;
        
        // Add faster, lower amplitude modulation
        height += Math.sin(time * 2.1 + i * 0.3) * 0.15;
        
        // Add some very quick, low amplitude noise
        height += Math.sin(time * 5.3 + i * 1.1) * 0.05;
        
        // Add randomness to simulate natural speech patterns
        height += (Math.random() * 0.1) - 0.05;
        
        // Keep the height within reasonable bounds
        // Clamp to reasonable range
        height = Math.max(0.05, Math.min(0.95, height));
        
        // Calculate the final height and position of each bar
        const barHeight = height * canvas.height * 0.8;
        const x = i * barSpacing;
        const y = (canvas.height - barHeight) / 2;
        
        // Draw the bar in white
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    };
    
    // Start the animation
    // Start the animation
    draw();
    
    // Log that the animation has started
    // Ensure we have a record of this animation frame for cleanup
    console.log('[RecordingManager] Fallback waveform animation started');
  },
  
  // Update the timer showing how long recording has been active
  // Update recording duration display
  updateDuration() {
    if (!this.recordingStartTime || !this.durationDisplay) return;

    // Calculate the duration in seconds since recording started
    const duration = Math.floor((Date.now() - this.recordingStartTime) / 1000);
    // Convert to minutes and seconds format
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    // Display the duration in the format "0:00"
    this.durationDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
  
  // Start the recording process
  // Start recording
  startRecording() {
    // Don't start a new recording if already recording
    // Prevent multiple recording sessions
    if (this.isRecording) {
      console.log('[RecordingManager] Already recording, ignoring duplicate startRecording call');
      return;
    }
    
    console.log('Starting recording...');
    
    // Clean up any previous recording state before starting a new one
    // IMPROVED: Always clean up previous state properly
    // Cancel any existing animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Set up the recording user interface and timer
    // Initialize UI
    this.showRecordingUI();
    this.recordingStartTime = Date.now();
    this.recordingTimer = setInterval(this.updateDuration.bind(this), 1000);
    this.isRecording = true;
    
    // Make sure the waveform canvas is ready for drawing
    // Initialize waveform canvas immediately to ensure it's ready
    if (this.waveformCanvas) {
      // Force canvas to be visible and sized correctly
      this.waveformCanvas.style.display = 'block';
      
      // Draw an initial blank waveform
      // Force an initial render of the canvas
      const ctx = this.waveformCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#444';
        ctx.fillRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      }
    }
    
    // Make the text input readonly while recording
    if (this.userInput) {
      this.userInput.readOnly = true;
    }
    
    // Handle recording differently for Android devices
    // For Android devices, initialize RecordRTC
    if (this.isAndroid && this.micStream) {
      console.log('[RecordingManager] Initializing RecordRTC for Android');
      try {
        // Check if the RecordRTC library is available
        // Ensure RecordRTC is available
        if (typeof RecordRTC === 'undefined') {
          console.error('[RecordingManager] RecordRTC not loaded. Make sure to include the library.');
          // If RecordRTC isn't loaded yet, load it now
          // Load RecordRTC if it's not already loaded
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/RecordRTC/5.6.2/RecordRTC.min.js';
          script.async = true;
          document.head.appendChild(script);
          
          // Set up what happens when the script is successfully loaded
          script.onload = () => {
            console.log('[RecordingManager] RecordRTC loaded dynamically');
            this.initializeRecordRTC();
          };
          
          // Set up what happens if the script fails to load
          script.onerror = () => {
            console.error('[RecordingManager] Failed to load RecordRTC');
            alert("Erreur de chargement de la bibliothèque d'enregistrement audio. Veuillez rafraîchir la page.");
            this.stopRecording(false);
          };
        } else {
          // If RecordRTC is already available, initialize it directly
          this.initializeRecordRTC();
        }
      } catch (e) {
        console.error('[RecordingManager] Error initializing RecordRTC:', e);
        this.stopRecording(false);
      }
    }
    
    // Start drawing the waveform visualization after a short delay
    // Start drawing waveform with a small delay to ensure UI is visible
    setTimeout(() => {
      // this.drawWaveform();
      this.drawWaveform(); // This will handle Edge browser detection internally
      console.log('Waveform visualization started');
    }, 50);
  },
  
  // Set up the RecordRTC library for Android devices
  // Initialize RecordRTC for Android devices
  initializeRecordRTC() {
    // Make sure we have access to the microphone
    if (!this.micStream) {
      console.error('[RecordingManager] No microphone stream available for RecordRTC');
      return;
    }
    
    // Check again if RecordRTC is available
    // Check if RecordRTC is available
    if (typeof RecordRTC === 'undefined') {
      console.error('[RecordingManager] RecordRTC is not available, falling back to simple recording');
      this.fallbackRecording();
      return;
    }
    
    console.log('[RecordingManager] Creating RecordRTC instance with stream:', this.micStream.id);
    
    // Make sure the audio context and analyzer are set up properly
    // CRITICAL FIX: Ensure the microphone stream is connected to the analyser on each new recording
    // This fixes the issue where waveform doesn't appear after first recording on Android
    if (this.audioContext) {
      // Check if the audio context is still usable
      // Check if the audio context is in a usable state
      if (this.audioContext.state === 'closed' || this.audioContext.state === 'closing') {
        console.log('[RecordingManager] Audio context is closed/closing in initializeRecordRTC, creating a new one');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Update any global audio context references
        // Update the global reference if it exists
        if (window.sharedAudioContext) {
          window.sharedAudioContext = this.audioContext;
        }
      }
      
      // Create a new audio analyzer if needed
      // Make sure we have an analyser for waveform visualization
      if (!this.analyser) {
        try {
          console.log('[RecordingManager] Creating new analyser in initializeRecordRTC');
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 1024;
          this.analyser.smoothingTimeConstant = 0.8;
        } catch (e) {
          console.error('[RecordingManager] Error creating analyser in initializeRecordRTC:', e);
        }
      }
      
      // Disconnect any previous audio connections to avoid doubled inputs
      // Disconnect any previous connections to avoid doubled inputs
      if (this.source) {
        try {
          this.source.disconnect();
        } catch (e) {
          console.log('[RecordingManager] Error disconnecting previous source:', e);
        }
      }
      
      try {
        // Create a new connection between the microphone and the analyzer
        // Create a new media stream source and connect it to the analyser
        this.source = this.audioContext.createMediaStreamSource(this.micStream);
        
        // Only connect to the analyzer if not using Edge browser (which has issues)
        // Only connect to analyser if it exists and not in Edge browser
        if (this.analyser && !this.isEdge) {
          this.source.connect(this.analyser);
          console.log('[RecordingManager] Re-connected media stream to analyser for waveform visualization');
        } else {
          console.warn('[RecordingManager] No analyser available to connect to or Edge browser detected');
        }
      } catch (e) {
        console.error('[RecordingManager] Error connecting to analyser:', e);
      }
    } else {
      console.warn('[RecordingManager] No audio context available for waveform in initializeRecordRTC');
    }
    
    // Create a new RecordRTC instance with appropriate settings
    // Create RecordRTC instance with appropriate options
    this.recordRTC = new RecordRTC(this.micStream, {
      type: 'audio',
      mimeType: 'audio/webm',
      sampleRate: 44100,
      desiredSampRate: 16000,
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 1,
      timeSlice: 1000, // update every second
      disableLogs: false,
      // This function gets called every second with the blob of data
      ondataavailable: (blob) => {
        console.log('[RecordRTC] Data available:', blob.size, 'bytes');
      }
    });
    
    // Start the recording
    // Start recording
    this.recordRTC.startRecording();
    console.log('[RecordingManager] RecordRTC started recording');
  },
  
  // Alternative recording method if RecordRTC isn't available
  // Fallback recording method using MediaRecorder API directly
  fallbackRecording() {
    console.log('[RecordingManager] Using fallback MediaRecorder for Android');
    
    try {
      // Set up the options for the MediaRecorder
      // Create MediaRecorder instance
      const options = {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      };
      
      // Check if the browser supports the preferred audio format
      // Check if the mimeType is supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/ogg; codecs=opus';
        
        // Try alternative formats if the first choice isn't supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          // Try without specifying the codec
          options.mimeType = 'audio/ogg';
          
          // If that still doesn't work, let the browser choose
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            // Fall back to the browser's default
            options.mimeType = '';
          }
        }
      }
      
      console.log(`[RecordingManager] Using MediaRecorder with mimeType: ${options.mimeType || 'browser default'}`);
      
      // Create the MediaRecorder
      // Create a MediaRecorder instance
      this.mediaRecorder = new MediaRecorder(this.micStream, options);
      
      // Array to store the audio data
      // Store audio chunks
      const audioChunks = [];
      
      // Set up what happens when audio data is available
      // Event handler for data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      // Set up what happens when recording stops
      // Event handler for recording stop
      this.mediaRecorder.onstop = () => {
        console.log('[RecordingManager] MediaRecorder stopped, processing audio chunks');
        
        // Combine all the audio chunks into a single blob
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
        
        // Create a simple object that works like RecordRTC for compatibility
        // Store the blob in the recordRTC object to maintain API compatibility
        this.recordRTC = {
          getBlob: () => audioBlob,
          destroy: () => {
            // Just a simple cleanup function
            this.mediaRecorder = null;
          }
        };
        
        // Check if we should process the audio transcript
        // Call the existing stopRecording callback-like behavior
        if (this.processingTranscript) {
          // Send the audio recording to the backend for transcription
          this.sendAudioToBackend(audioBlob)
            .then(transcript => {
              if (transcript) {
                console.log('[RecordingManager] Received transcript from backend:', transcript);
                
                // Update the input field with the transcript
                if (this.userInput) {
                  // Get the user's preference for automatic transcription
                  // Get the autoTranscribe setting
                  const autoTranscribe = this.SettingsManager.getSetting('autoTranscribeVoice');
                  
                  if (autoTranscribe) {
                    // If autoTranscribe is on, handle sending the transcript automatically
                    // Store internally without showing in input
                    this._currentTranscript = transcript;
                    
                    // Clear the input field to avoid showing the transcript
                    // Clear input field
                    this.userInput.value = '';
                    this.userInput.dispatchEvent(new Event('input'));
                    
                    // Display the user's message in the chat
                    // Call appendMessage to show the message
                    if (typeof appendMessage === 'function') {
                      appendMessage(transcript, 'user');
                    }
                    
                    // Call the appropriate API based on the user's settings
                    // Get bot response based on settings
                    const alwaysReadOutLoud = this.SettingsManager.getSetting('alwaysReadOutLoud');
                    const apiAvailable = (typeof getBotResponse === 'function' || typeof getBotResponseAndAudio === 'function');
                    
                    if (apiAvailable) {
                      if (alwaysReadOutLoud && typeof getBotResponseAndAudio === 'function') {
                        console.log('Calling getBotResponseAndAudio');
                        getBotResponseAndAudio(transcript);
                      } else if (typeof getBotResponse === 'function') {
                        console.log('Calling getBotResponse');
                        getBotResponse(transcript);
                      }
                    } else {
                      // If the API isn't available, submit the form directly
                      this.submitFormWithTranscript(transcript);
                    }
                  } else {
                    // If autoTranscribe is off, just show the transcript in the input field
                    // If autoTranscribe is off, just show in input field
                    this.userInput.value = transcript;
                    this.userInput.dispatchEvent(new Event('input'));
                    this.userInput.setSelectionRange(transcript.length, transcript.length);
                    // Only focus the input field on non-Android devices to prevent keyboard from appearing
                    if (!this.isAndroid) {
                      this.userInput.focus();
                    }
                  }
                }
              }
            })
            .catch(error => {
              console.error('[RecordingManager] Error sending audio to backend:', error);
              alert("Erreur lors de la reconnaissance vocale. Veuillez réessayer.");
            })
            .finally(() => {
              // Clear the flag to allow new recordings
              this.processingTranscript = false;
            });
        }
      };
      
      // Start recording audio in 1-second chunks
      // Start recording
      this.mediaRecorder.start(1000); // Collect data in 1-second chunks
      console.log('[RecordingManager] MediaRecorder started');
    } catch (error) {
      console.error('[RecordingManager] Error setting up MediaRecorder:', error);
      alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  },
  
  // Stop recording
  stopRecording(shouldKeepTranscript = false) {
    console.log('stopRecording called with shouldKeepTranscript =', shouldKeepTranscript);
    
    // Avoid trying to stop recording if it's already stopped
    // Prevent multiple stopRecording calls for the same recording session
    if (!this.isRecording && this.micStream === null) {
      console.log('Recording already stopped, ignoring duplicate call');
      return;
    }
    
    // Mark recording as stopped and clear timers
    this.isRecording = false;
    clearInterval(this.recordingTimer);
    this.recordingStartTime = 0;

    // Cancel any waveform animation that's running
    // IMPROVED: Clear any animation frames
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Handle Android-specific recording stop
    // Handle Android-specific RecordRTC recording
    if (this.isAndroid) {
      console.log('[RecordingManager] Stopping Android recording');

      // Show a visual indicator that we're processing the audio
      // For Android, show a visual indicator immediately that we're processing
      if (shouldKeepTranscript && typeof appendThinkingIndicator === 'function') {
        console.log('[RecordingManager] Adding early thinking indicator for Android');
        appendThinkingIndicator();
        
        // Hide the recording UI immediately for better user experience
        // For better UX, immediately clear the recording UI without waiting
        this.hideRecordingUI();
        
        // Show a message that we're processing the speech
        // Show "Transcribing..." message near thinking indicator
        const messagesDiv = document.getElementById('messagesDiv');
        if (messagesDiv) {
          const transcribingMsg = document.createElement('div');
          transcribingMsg.id = 'transcribing-message';
          transcribingMsg.style.textAlign = 'center';
          transcribingMsg.style.fontSize = '14px';
          transcribingMsg.style.color = '#888';
          transcribingMsg.style.margin = '5px 0';
          transcribingMsg.textContent = 'Transcription en cours...';
          messagesDiv.appendChild(transcribingMsg);
          
          // Scroll to show the new message
          // Scroll to show this message
          if (typeof UtilityManager === 'object' && typeof UtilityManager.scrollToBottom === 'function') {
            UtilityManager.scrollToBottom();
          } else {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }
        }
      }

      // Handle RecordRTC recording stop
      if (this.recordRTC) {
        console.log('[RecordingManager] Stopping RecordRTC');
        this.recordRTC.stopRecording(async () => {
          // Get the recorded audio as a blob
          // Get the recorded audio blob
          const audioBlob = this.recordRTC.getBlob();
          console.log('[RecordingManager] RecordRTC recording stopped, blob size:', audioBlob.size, 'bytes');
          
          if (shouldKeepTranscript) {
            // Send the audio to the backend for transcription
            // Send the audio to the backend for transcription
            try {
              const transcript = await this.sendAudioToBackend(audioBlob);
              if (transcript) {
                console.log('[RecordingManager] Received transcript from backend:', transcript);
                
                // Remove the thinking indicator once we have a transcript
                // Remove the early thinking indicator if we added one
                if (typeof removeThinkingIndicator === 'function') {
                  removeThinkingIndicator();
                }
                
                // Remove the "transcribing" message
                // Remove the transcribing message if it exists
                const transcribingMsg = document.getElementById('transcribing-message');
                if (transcribingMsg) {
                  transcribingMsg.remove();
                }
                
                // Process the transcript for language consistency and handle any needed notifications
                // Process the transcript for language consistency and notifications
                const processedTranscript = await this.processAndroidTranscript(transcript);
                
                // Update the input field or send the message based on user settings
                // Update the input field with the transcript
                if (this.userInput) {
                  // Check if auto-transcribe is enabled
                  // Get the autoTranscribe setting
                  const autoTranscribe = this.SettingsManager.getSetting('autoTranscribeVoice');
                  
                  if (autoTranscribe) {
                    // Store transcript for later use without showing in input field
                    // Store internally without showing in input
                    this._currentTranscript = processedTranscript;
                    
                    // Mark that we're processing a transcript
                    // Process the transcript immediately
                    this.processingTranscript = true;
                    
                    // Clear the input field
                    // Clear input field
                    this.userInput.value = '';
                    this.userInput.dispatchEvent(new Event('input'));
                    
                    // Show the user's message in the chat
                    // Call appendMessage to show the message
                    if (typeof appendMessage === 'function') {
                      appendMessage(processedTranscript, 'user');
                    }
                    
                    // Get the bot's response based on user settings
                    // Get bot response based on settings
                    const alwaysReadOutLoud = this.SettingsManager.getSetting('alwaysReadOutLoud');
                    const apiAvailable = (typeof getBotResponse === 'function' || typeof getBotResponseAndAudio === 'function');
                    
                    if (apiAvailable) {
                      if (alwaysReadOutLoud && typeof getBotResponseAndAudio === 'function') {
                        console.log('Calling getBotResponseAndAudio');
                        getBotResponseAndAudio(processedTranscript);
                      } else if (typeof getBotResponse === 'function') {
                        console.log('Calling getBotResponse');
                        getBotResponse(processedTranscript);
                      }
                    } else {
                      this.submitFormWithTranscript(processedTranscript);
                    }
                  } else {
                    // If autoTranscribe is off, just show in input field
                    this.userInput.value = processedTranscript;
                    this.userInput.dispatchEvent(new Event('input'));
                    this.userInput.setSelectionRange(processedTranscript.length, processedTranscript.length);
                    // Only focus on non-Android devices to prevent keyboard from appearing
                    if (!this.isAndroid) {
                      this.userInput.focus();
                    }
                  }
                }
              }
            } catch (error) {
              console.error('[RecordingManager] Error sending audio to backend:', error);
              alert("Erreur lors de la reconnaissance vocale. Veuillez réessayer.");
            }
          }
          
          // Release RecordRTC resources
          this.recordRTC.destroy();
          this.recordRTC = null;
        });
      } else if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        // Handle the fallback MediaRecorder if we're using it
        // Handle the MediaRecorder fallback
        console.log('[RecordingManager] Stopping MediaRecorder fallback');
        this.processingTranscript = shouldKeepTranscript;
        this.mediaRecorder.stop();
      } else {
        console.warn('[RecordingManager] No active recorder found on Android');
      }
    }
    // Handle speech recognition stopping for non-Android devices
    // Handle speech recognition stopping for non-Android devices
    else if (this.speechRecognitionSupported && this.recognition) {
      try {
        // Stop the speech recognition completely
        this.recognition.abort();
        this.recognition.stop();
        console.log('Speech recognition stopped');
        
        // Safari requires special handling - fully destroy the recognition object
        // For Safari, completely destroy the recognition object
        if (UtilityManager.isSafari()) {
          this.recognition = null;
          console.log('Recognition object destroyed for Safari');
        }
      } catch (e) {
        console.log('Recognition stop error:', e);
      }
    }

    // Special handling for Safari browser
    // Special handling for Safari
    if (UtilityManager.isSafari()) {
      console.log('Using Safari-specific microphone cleanup');
      if (this.micStream) {
        // Get all audio tracks from the microphone stream
        const audioTracks = this.micStream.getAudioTracks();
        audioTracks.forEach(track => {
          // First disable the track before stopping (Safari-specific technique)
          // First disable the track before stopping
          track.enabled = false;
          console.log(`Track ${track.id} disabled`);
          
          // Then stop after a short delay to ensure Safari releases the microphone properly
          // Then stop after a short delay
          setTimeout(() => {
            track.stop();
            console.log(`Track ${track.id} stopped with delay`);
          }, 50);
        });
      }
    } else {
      // Standard handling for other browsers
      // Standard handling for other browsers
      if (this.micStream) {
        // Stop all tracks in the microphone stream
        this.micStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Track ${track.id} stopped, state:`, track.readyState);
        });
      }
    }
    
    // Remove the reference to the microphone stream
    // Null the stream reference in all cases
    this.micStream = null;
    console.log('Microphone stream reference cleared');

    // Release audio context resources
    // Close audio context
    if (this.audioContext) {
      try {
        // Only try to close if it's not already closed
        if (this.audioContext.state !== 'closed' && this.audioContext.state !== 'closing') {
          console.log('[RecordingManager] Closing audio context in state:', this.audioContext.state);
          this.audioContext.close().then(() => {
            console.log('AudioContext closed successfully');
          }).catch(err => {
            console.error('Error closing AudioContext:', err);
          });
        } else {
          console.log('[RecordingManager] Audio context already closed or closing, state:', this.audioContext.state);
        }
      } catch (e) {
        console.error('[RecordingManager] Error with audio context:', e);
      }
      // Clear references to audio processing objects
      this.audioContext = null;
      this.analyser = null;
    }

    // Clear the text input if we're not keeping the transcript
    if (!shouldKeepTranscript && this.userInput) {
      this.userInput.value = '';
    }

    // Hide the recording interface
    // Hide UI before processing transcript to avoid confusion
    this.hideRecordingUI();

    // Set a flag to indicate we're processing the transcript (to prevent duplicate submissions)
    // Mark that we're processing a transcript to prevent duplicate submissions
    if (shouldKeepTranscript && !this.isAndroid) {
      this.processingTranscript = true;
    }

    // Wait a short time to allow the UI updates to complete, then process the transcript
    setTimeout(() => {
      // Make the text input field editable again
      if (this.userInput) {
        this.userInput.readOnly = false;
      }

      // Process the transcript (if we have one and we're not on Android)
      // Process the transcript (if we have one and we're not on Android)
      // Android transcripts are handled in the RecordRTC callback
      if (shouldKeepTranscript && this.userInput && !this.isAndroid) {
        // Get the transcript - either from input field or internal property
        const autoTranscribe = this.SettingsManager.getSetting('autoTranscribeVoice');
        let transcript = '';
        
        // Choose where to get the transcript from based on user settings
        if (autoTranscribe && this._currentTranscript) {
          // If autoTranscribe is ON, use our internally stored transcript
          transcript = this._currentTranscript;
          // Clear it after use
          this._currentTranscript = '';
        } else {
          // Otherwise use the input field value
          transcript = this.userInput.value.trim();
        }
        
        console.log('Processing transcript:', transcript);
        
        // If there's no transcript, don't proceed
        if (transcript === '') {
          console.log('No transcript to process');
          this.processingTranscript = false;
          return;
        }
        
        // Log the current auto-transcribe setting
        // Use the SettingsManager to get autoTranscribe setting
        console.log('autoTranscribe setting =', autoTranscribe);
        
        // Handle the transcript differently based on auto-transcribe setting
        if (autoTranscribe) {
          console.log('Auto-transcribe is enabled, submitting form...');
          
          // When auto-transcribe is on, don't keep text in the input field
          // When auto-transcribe is on, we DON'T want to keep text in the input field
          // Clear the input immediately to prevent it from showing up
          this.userInput.value = '';
          // Trigger input event to update button state
          this.userInput.dispatchEvent(new Event('input')); 
          
          // Check if the API functions are available
          // First check if the API functions are properly available
          const apiAvailable = (typeof getBotResponse === 'function' || typeof getBotResponseAndAudio === 'function');
          console.log('API functions available:', apiAvailable);
          
          // Show the user's message in the chat
          // Call appendMessage first to show the message
          if (typeof appendMessage === 'function') {
            appendMessage(transcript, 'user');
          } else {
            console.error('appendMessage function not available');
          }
          
          // Get the setting for whether to always read responses out loud
          // Get bot response directly based on settings
          const alwaysReadOutLoud = this.SettingsManager.getSetting('alwaysReadOutLoud');
          
          // Choose which API to call based on settings and availability
          if (apiAvailable) {
            if (alwaysReadOutLoud && typeof getBotResponseAndAudio === 'function') {
              console.log('Calling getBotResponseAndAudio');
              getBotResponseAndAudio(transcript);
            } else if (typeof getBotResponse === 'function') {
              console.log('Calling getBotResponse');
              getBotResponse(transcript);
            }
          } else {
            // If API functions aren't available, use form submission as fallback
            // Fallback: directly submit the form if functions not available
            console.log('API functions not available, using form submission fallback');
            this.submitFormWithTranscript(transcript);
          }
        } else {
          // If auto-transcribe is off, just show the transcript in the input field
          // If autoTranscribe is off, just show in input field
          this.userInput.value = transcript;
          this.userInput.dispatchEvent(new Event('input'));
          this.userInput.setSelectionRange(transcript.length, transcript.length);
          // Only focus on non-Android devices to prevent keyboard from appearing
          if (!this.isAndroid) {
            this.userInput.focus();
          }
        }
      } else {
        console.log('No transcript to keep or shouldKeepTranscript is false');
      }
      
      // Clear the processing flag for non-Android devices
      // Clear our processing flag if not on Android (Android handles this in the RecordRTC callback)
      if (!this.isAndroid) {
        this.processingTranscript = false;
      }
      
      // Double-check that the microphone is fully released
      // Verify microphone is fully released after stopping
      setTimeout(() => {
        console.log('Verifying microphone release status:');
        this.checkMicrophoneStatus();
      }, 1000);
    }, 100);
  },
  
  // Send recorded audio to the server for transcription
  // Send audio to backend for transcription (for Android devices)
  async sendAudioToBackend(audioBlob) {
    console.log('[RecordingManager] Sending audio to backend for transcription, size:', audioBlob.size, 'bytes');
    
    // Get the language currently selected by the user
    // Get current selected language from UI
    const currentLanguage = document.getElementById('languageSelect') ? 
      document.getElementById('languageSelect').value : 'fr';
    
    console.log('[RecordingManager] Current language selected:', currentLanguage);
    
    // Try compression for large audio files to improve upload speed
    // Try to compress the audio before sending if it's large
    let blobToSend = audioBlob;
    if (audioBlob.size > 100000) { // If larger than ~100KB
      try {
        console.log('[RecordingManager] Compressing audio before sending');
        // Create a data container to send the audio and settings
        // Create a FormData object to send the audio blob
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('compress', 'true');
        formData.append('userSelectedLanguage', currentLanguage); // Send selected language
        
        // Send the audio to the server API with compression enabled
        // Send the audio to the backend API with compression flag
        const response = await fetch('/api/speech-to-text', {
          method: 'POST',
          body: formData
        });
        
        // Check if the server responded successfully
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }
        
        // Get the transcript from the server's response
        // Parse the response to get the transcript
        const data = await response.json();
        console.log('[RecordingManager] Received transcript from backend:', data);
        
        return data.transcript;
      } catch (error) {
        console.error('[RecordingManager] Error with compression, falling back to regular method:', error);
        // Fall back to regular method below
      }
    }
    
    // Standard method without compression
    // Regular method (without compression)
    try {
      // Create a data container for the audio file
      // Create a FormData object to send the audio blob
      const formData = new FormData();
      formData.append('file', blobToSend, 'recording.webm');
      formData.append('userSelectedLanguage', currentLanguage); // Send selected language
      
      // Send the audio to the server
      // Send the audio to the backend API
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });
      
      // Check if the server responded successfully
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }
      
      // Get the transcript from the server's response
      // Parse the response to get the transcript
      const data = await response.json();
      console.log('[RecordingManager] Received transcript from backend:', data);
      
      return data.transcript;
    } catch (error) {
      console.error('[RecordingManager] Error sending audio to backend:', error);
      throw error;
    }
  },
  
  // Detect what language text is in
  // Language detection
  detectLanguage(text) {
    // Skip empty text
    if (!text || text.trim() === '') return null;

    // First check for common short greetings that are easy to identify
    // Check for short greetings first
    const lowerText = text.trim().toLowerCase();

    // Check each language's list of common greeting words
    // Check against supported languages' short greetings
    for (const [lang, config] of Object.entries(this.SUPPORTED_LANGUAGES)) {
      if (config.shortGreetings.includes(lowerText)) {
        return lang;
      }
    }

    // For longer text, use more sophisticated language detection
    // For longer text, use LanguageManager's detection
    if (text.length >= 12) {
      try {
        // Try to detect the language of the text
        const detectedLang = LanguageManager.detectLanguage(text);
        
        // Have a higher threshold for switching from French to English
        // Higher threshold for switching from French
        if (getCurrentLanguage() === 'fr' && detectedLang === 'en' && text.length < 40) {
          console.log("Not switching from French to English - text too short");
          return null;
        }

        return detectedLang;
      } catch (error) {
        console.error('Language detection error:', error);
      }
    }

    // If we couldn't detect the language, return null
    return null;
  },
  
  // Show a notification when the language is changed
  // Show language change notification
  showLanguageChangeNotification(lang) {
    // Find or create the notification element
    const notification = document.getElementById('languageChangeNotification') ||
      this.createLanguageChangeNotification();

    // Set the notification text and show it
    notification.textContent = `Switched to ${this.SUPPORTED_LANGUAGES[lang].name}`;
    notification.style.opacity = '1';

    // Hide the notification after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 2000);
  },

  // Create the notification element for language changes
  // Create language change notification element
  createLanguageChangeNotification() {
    // Create a new div for the notification
    const notification = document.createElement('div');
    notification.id = 'languageChangeNotification';
    notification.className = 'language-change-notification';
    document.body.appendChild(notification);
    return notification;
  },

  // Submit a transcript using the chat form
  // Submit form with transcript
  submitFormWithTranscript(transcript) {
    console.log('Manually submitting form with transcript:', transcript);
    
    // Find the chat form in the document
    // First ensure the form exists
    const form = document.getElementById('chatForm');
    if (!form) {
      console.error('Cannot find chat form to submit');
      return;
    }
    
    // Put the transcript into the text input field
    // Set the input value temporarily to the transcript
    const userInput = document.getElementById('userInput');
    if (userInput) {
      userInput.value = transcript;
    }
    
    // Simulate submitting the form
    // Create and dispatch a submit event
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    
    // Clear the input field after submission
    // After submission, clear the input
    if (userInput) {
      userInput.value = '';
      userInput.dispatchEvent(new Event('input'));
    }
    
    console.log('Form submission complete');
  },

  // Check if the microphone is still actively being used
  // Debug method to check if mic is still active
  checkMicrophoneStatus() {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        // Find all audio input devices
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        // Count active audio inputs (those with labels, which means they've been accessed)
        const activeInputs = audioInputs.filter(device => device.label);
        
        console.log('Total audio inputs:', audioInputs.length);
        console.log('Active audio inputs (with labels):', activeInputs.length);
        
        if (activeInputs.length > 0) {
          // If there are active inputs, log their names
          console.log('Active microphones:', activeInputs.map(d => d.label));
          return true;
        } else {
          // If no active inputs, log that fact
          console.log('No active microphones detected');
          return false;
        }
      })
      .catch(err => {
        console.error('Error checking microphone status:', err);
        return false;
      });
  },

  // Completely reset the microphone connection
  // Add this new method after checkMicrophoneStatus
  resetMicrophoneAccess() {
    console.log('[RecordingManager] Attempting to reset microphone access');
    
    // Release any existing microphone connection
    // First release any existing resources
    if (this.micStream) {
      try {
        const tracks = this.micStream.getTracks();
        tracks.forEach(track => {
          // Disable the track first
          track.enabled = false;
          // Then stop it completely
          track.stop();
          console.log(`[RecordingManager] Released track: ${track.id}`);
        });
        this.micStream = null;
      } catch (e) {
        console.error('[RecordingManager] Error releasing existing micStream:', e);
      }
    }
    
    // Disconnect the audio source from the audio processing system
    // Disconnect audio source
    if (this.source) {
      try {
        this.source.disconnect();
        console.log('[RecordingManager] Disconnected audio source');
      } catch (e) {
        console.error('[RecordingManager] Error disconnecting audio source:', e);
      }
      this.source = null;
    }
    
    // Clear the reference to the audio analyzer
    // Clear analyser reference but don't try to disconnect it
    // as it's not a node with inputs/outputs to disconnect
    this.analyser = null;
    
    // Close the audio context if it's open
    // Close existing audio context if open
    if (this.audioContext) {
      try {
        this.audioContext.close().catch(e => {});
        this.audioContext = null;
        console.log('[RecordingManager] Closed existing audio context');
      } catch (e) {
        console.error('[RecordingManager] Error closing audioContext:', e);
      }
    }
    
    // Special handling for iOS devices
    // For iOS devices, we need more aggressive cleanup
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      console.log('[RecordingManager] iOS device detected, performing special cleanup');
      
      // Clear all references to speech recognition
      // Force garbage collection by nullifying references (helps on iOS)
      if (this.recognition) {
        try {
          this.recognition.abort();
          this.recognition.stop();
        } catch (e) {}
        this.recognition = null;
      }
      
      // Try to unlock audio on iOS - this helps reset the audio system
      // Trigger a silent unlockAudio call - this helps reset iOS audio system
      if (window.AudioUnlockUtils && typeof window.AudioUnlockUtils.unlockAudio === 'function') {
        window.AudioUnlockUtils.unlockAudio(true);
      }
    }
    
    // Wait a short time before continuing, to ensure resources are fully released
    return new Promise(resolve => {
      // Small delay to ensure resources are released before attempting to get new ones
      setTimeout(() => {
        console.log('[RecordingManager] Microphone access reset completed');
        resolve(true);
      }, isIOS ? 300 : 100); // Longer delay for iOS
    });
  },

  // Process the transcript for Android devices
  // Process the transcript (Android)
  async processAndroidTranscript(transcript) {
    // Get the language the user has selected in the UI
    // Get the currently selected language
    const currentLanguage = document.getElementById('languageSelect') ? 
      document.getElementById('languageSelect').value : 'fr';
    
    // Check if the transcript might be in a different language than the selected one
    // Check if we need to display a notification about language
    // Simple language detection for common words to see if transcript might be in a different language
    let detectedLang = this.detectSimpleLanguage(transcript);
    
    if (detectedLang && detectedLang !== currentLanguage) {
      // Show a notification to let the user know the bot will still respond in the selected language
      // Show notification that responses will still be in the selected language
      const langNames = {
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish'
      };
      
      // Prepare notification messages in different languages
      const notificationMsg = {
        'en': `Note: The bot will respond in ${langNames[currentLanguage]} as that is the selected language.`,
        'fr': `Remarque : Le bot répondra en ${currentLanguage === 'en' ? 'anglais' : (currentLanguage === 'es' ? 'espagnol' : 'français')} car c'est la langue sélectionnée.`,
        'es': `Nota: El bot responderá en ${currentLanguage === 'en' ? 'inglés' : (currentLanguage === 'fr' ? 'francés' : 'español')} ya que es el idioma seleccionado.`
      };
      
      // Display the notification if the showToast function is available
      // Show a toast notification
      if (typeof showToast === 'function') {
        showToast(notificationMsg[currentLanguage] || notificationMsg['en']);
      } else {
        console.log('Language mismatch notification:', notificationMsg[currentLanguage] || notificationMsg['en']);
      }
    }
    
    // Return the transcript without any modifications
    return transcript;
  },
  
  // Simple language detection based on common words
  // Simple language detection for common words
  detectSimpleLanguage(text) {
    // Skip short texts that don't have enough words for reliable detection
    if (!text || text.trim().length < 5) return null;
    
    // Convert to lowercase for case-insensitive matching
    const lowerText = text.toLowerCase().trim();
    
    // Lists of common words/patterns in different languages
    // Common English words/patterns
    const englishPatterns = ['the', 'is', 'are', 'what', 'where', 'when', 'how', 'can you', 'i need', 'please'];
    // Common French words/patterns
    const frenchPatterns = ['le', 'la', 'les', 'est', 'sont', 'que', 'où', 'quand', 'comment', 'je veux', 's\'il vous plaît'];
    // Common Spanish words/patterns
    const spanishPatterns = ['el', 'la', 'los', 'es', 'son', 'que', 'donde', 'cuando', 'como', 'necesito', 'por favor'];
    
    // Count matches for each language
    let enMatches = 0, frMatches = 0, esMatches = 0;
    
    // Count how many English words are in the text
    // Count matches for each language
    englishPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) enMatches++;
    });
    
    // Count how many French words are in the text
    frenchPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) frMatches++;
    });
    
    // Count how many Spanish words are in the text
    spanishPatterns.forEach(pattern => {
      if (lowerText.includes(pattern)) esMatches++;
    });
    
    // Determine which language has the most matches
    // Determine the most likely language
    if (enMatches > frMatches && enMatches > esMatches && enMatches > 0) {
      return 'en';
    } else if (frMatches > enMatches && frMatches > esMatches && frMatches > 0) {
      return 'fr';
    } else if (esMatches > enMatches && esMatches > frMatches && esMatches > 0) {
      return 'es';
    }
    
    // If no clear winner, return null
    return null;
  },
}; 