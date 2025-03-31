// This file controls all audio playback for the chatbot, handling how sounds are played, paused, resumed, and controlled
// audioPlaybackManager.js
// Module for handling audio playback and controls

// Import the tools that help with browser audio compatibility and event handling
import { AudioUnlockUtils, EventSystem } from './audioUnlockUtils.js';

// The main object that manages all audio playback features
export const AudioPlaybackManager = {
  // Information about the current state of audio playback
  
  // Tracks which message is currently playing audio
  currentlyPlayingMsgDiv: null,
  // Controls how fast the audio plays (1 = normal speed, 2 = double speed, etc.)
  globalPlaybackRate: 1,
  // Keeps track of the playback state for each message (playing, paused, etc.)
  messageStateMap: new Map(), // States: 'IDLE', 'PLAYING', 'PAUSED', 'FINISHED'
  // Stores a reference to an audio element that's been successfully unlocked for playback
  unlockedAudio: null,
  // List of messages waiting to play automatically
  pendingAutoplayMessages: [],
  // Whether the user has clicked or touched the screen (needed for autoplay on some browsers)
  hasUserInteracted: false,
  // The audio element currently being used
  currentAudio: null,
  // The message element currently being handled
  currentMessage: null,
  // Whether any audio is currently playing
  isPlaying: false,
  // Container for all chat messages
  messageElems: null,
  // Keeps track of all pending audio requests
  activeRequests: {},
  // Stores audio files in memory to avoid reloading them
  audioCache: {},
  // Controls the volume level of all audio (0.0 to 1.0)
  globalVolumeLevel: 1.0,
  // A special audio processing system for advanced audio manipulation
  audioContext: null,
  // Check if the user is on a mobile device
  isMobileDevice: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  // Check if the user is on an iOS device (iPhone, iPad)
  isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
  // Check if the user is on an Android device
  isAndroid: /Android/i.test(navigator.userAgent),
  
  // Set up the audio manager when the page loads
  initialize() {
    // Set up detection for the first time a user interacts with the page
    this.setupFirstInteractionHandler();
    
    // Make sure the playback speed starts at normal speed
    this.globalPlaybackRate = 1;
    
    // Set up special handling for mobile devices
    this.initMobileAudioUnlock();
    
    // Log the current state of the audio system if available
    if (this.audioContext) {
      console.log('[AudioPlaybackManager:initialize] AudioContext state:', this.audioContext.state);
    }
    
    // Stop right-click menus from appearing on audio buttons
    this.preventContextMenuOnVocalButtons();
    
    // Get the container that holds all chat messages
    this.messageElems = document.getElementById('messages');

    // Load saved volume settings from previous sessions if available
    const savedVolume = localStorage.getItem('audioVolumeLevel');
    if (savedVolume !== null) {
      this.globalVolumeLevel = parseFloat(savedVolume);
    }
    
    // Load saved playback speed from previous sessions if available
    const savedPlaybackRate = localStorage.getItem('audioPlaybackRate');
    if (savedPlaybackRate !== null) {
      this.globalPlaybackRate = parseFloat(savedPlaybackRate);
    }
    
    // Set up the audio processing system, using a shared one if available
    if (window.sharedAudioContext) {
      console.log('[AudioPlayback] Using shared AudioContext');
      this.audioContext = window.sharedAudioContext;
    } else if (window.AudioManager && window.AudioManager.getSharedAudioContext) {
      console.log('[AudioPlayback] Using AudioManager.getSharedAudioContext()');
      this.audioContext = window.AudioManager.getSharedAudioContext();
    } else {
      console.log('[AudioPlayback] Creating new AudioContext (no shared context available)');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Watch for new messages being added to the chat
    this.setupMutationObserver();
    
    // Return this object so it can be used by other code
    return this;
  },
  
  // Special setup for mobile devices which have stricter audio playback rules
  initMobileAudioUnlock() {
    // Only run this code if the user is on a mobile device
    if (this.isMobileDevice) {
      console.log('[AudioPlayback] Initializing mobile audio unlock');
      
      // When the user touches the screen, try to unlock audio playback
      document.addEventListener('touchstart', () => {
        // Attempt to unlock audio when the user touches the screen
        AudioUnlockUtils.unlockAudio(true);
      }, { once: true });
      
      // When the user clicks, also try to unlock audio playback
      document.addEventListener('click', () => {
        // Attempt to unlock audio when the user clicks
        AudioUnlockUtils.unlockAudio(true);
      }, { once: true });
    } else {
      console.log('[AudioPlayback] Not a mobile device, skipping mobile-specific audio unlock');
    }
  },
  
  // Main function to play audio for a specific message
  async playMessageAudio(msgDiv, audioUrl) {
    console.log(`[AudioPlaybackManager:playMessageAudio] Starting playback for message ID: ${msgDiv.dataset.messageId || 'unknown'}`);
    
    // Save the audio URL in the message element for future use
    msgDiv.dataset.audioUrl = audioUrl;
    
    // If something else is already playing, stop it first
    if (this.currentlyPlayingMsgDiv && this.currentlyPlayingMsgDiv !== msgDiv) {
      console.log(`[AudioPlayback] Stopping previous audio`);
      this.stopCurrentlyPlayingAudio(false);
    }

    // Make sure audio is unlocked before trying to play
    await AudioUnlockUtils.unlockAudio();

    // Hide the button that starts voice playback
    const vocalButton = msgDiv.querySelector('.vocal-button');
    if (vocalButton) {
      vocalButton.style.display = 'none';
      vocalButton.style.visibility = 'hidden';
    }

    // Remember which message is currently playing
    this.currentlyPlayingMsgDiv = msgDiv;
    const messageId = msgDiv.dataset.messageId;

    // Update the status of this message to show it's playing
    this.messageStateMap.set(messageId, 'PLAYING');

    try {
      // Check if this is a mobile device (needs special handling)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      let playedViaInline = false;
      
      console.log(`[AudioPlaybackManager:playMessageAudio] Is mobile device: ${isMobile}, Has inline element: ${!!AudioUnlockUtils.inlineAudioElement}`);
      
      // Special handling for mobile devices using a visible audio element in the page
      if (isMobile && AudioUnlockUtils.inlineAudioElement) {
        try {
          console.log('[AudioPlaybackManager:playMessageAudio] Attempting to play via inline element on mobile');
          await AudioUnlockUtils.playViaInlineElement(audioUrl);
          playedViaInline = true;
          console.log('[AudioPlayback] Successfully played via inline element');
          
          // Set the playback speed for the inline audio element
          if (AudioUnlockUtils.inlineAudioElement) {
            AudioUnlockUtils.inlineAudioElement.playbackRate = this.globalPlaybackRate;
            console.log(`[AudioPlayback] Setting inline element playback rate to ${this.globalPlaybackRate}x`);
          }
          
          // Update the playback controls in the UI
          this.updateAudioControls(msgDiv);
          
          // Set up what happens when the audio finishes playing
          AudioUnlockUtils.inlineAudioElement.onended = () => {
            console.log(`[AudioPlayback] Inline element playback ENDED - performing COMPLETE cleanup`);
            const messageId = msgDiv.dataset.messageId;
            this.messageStateMap.set(messageId, 'FINISHED');
            
            // Clean up all audio resources thoroughly when playback finishes
            if (this.unlockedAudio) {
              this.unlockedAudio.onended = null;
              this.unlockedAudio.oncanplay = null;
              this.unlockedAudio.onerror = null;
              this.unlockedAudio.pause();
              this.unlockedAudio.src = '';
              try {
                this.unlockedAudio.load();
              } catch (e) {}
              this.unlockedAudio = null;
            }
            
            // Also clean up the inline audio element
            AudioUnlockUtils.inlineAudioElement.src = '';
            try {
              AudioUnlockUtils.inlineAudioElement.load();
            } catch (e) {}
            
            // Make sure the audio context is running
            if (AudioUnlockUtils.audioContext && AudioUnlockUtils.audioContext.state === 'suspended') {
              try {
                AudioUnlockUtils.audioContext.resume().catch(e => {});
              } catch (e) {}
            }
            
            // Clear the reference to the currently playing message
            this.currentlyPlayingMsgDiv = null;
            
            // Update the UI controls to show playback has finished
            this.updateAudioControls(msgDiv);
          };
        } catch (err) {
          console.warn('[AudioPlayback] Failed to play via inline element, falling back to regular Audio', err);
        }
      }
      
      // If we couldn't play using the inline element, use a regular audio element
      if (!playedViaInline) {
        // Create a new audio element for playing this sound
        console.log(`[AudioPlayback] Creating audio element with URL: ${audioUrl.substring(0, 50)}...`);
        
        // Set up a new audio element with all attributes needed for playback
        this.unlockedAudio = new Audio();
        
        // Add special attributes to help with playback on different browsers
        this.unlockedAudio.setAttribute("playsinline", "true");
        this.unlockedAudio.setAttribute("autoplay", "true");
        this.unlockedAudio.setAttribute("webkit-playsinline", "true");
        this.unlockedAudio.setAttribute("controls", "");
        this.unlockedAudio.preload = "auto";
        
        // Set the playback speed to match the global setting
        this.unlockedAudio.playbackRate = this.globalPlaybackRate;
        console.log(`[AudioPlayback] Setting playback rate to ${this.globalPlaybackRate}x`);
        
        // Set up event handlers for various audio events
        EventSystem.registerAudioEvents(this.unlockedAudio, {
          // Function that runs when the audio is ready to play
          onCanPlay: () => {
            console.log(`[AudioPlayback] Audio can play through, attempting play()`);
            this.unlockedAudio.play().catch(e => {
              console.warn('[AudioPlayback] Could not autoplay on event:', e);
            });
          },
          // Function that runs if there's an error with the audio
          onError: (e) => {
            console.error(`[AudioPlayback] Audio error:`, e);
            this.resetAudioState(msgDiv);
          },
          // Function that runs when the audio finishes playing
          onEnded: () => {
            console.log(`[AudioPlayback] Audio playback ENDED - performing COMPLETE cleanup`);
            const messageId = msgDiv.dataset.messageId;
            this.messageStateMap.set(messageId, 'FINISHED');
            
            // Clean up all audio resources thoroughly when playback finishes
            if (this.unlockedAudio) {
              this.unlockedAudio.onended = null;
              this.unlockedAudio.oncanplay = null;
              this.unlockedAudio.onerror = null;
              this.unlockedAudio.pause();
              this.unlockedAudio.src = '';
              try {
                this.unlockedAudio.load();
              } catch (e) {}
              this.unlockedAudio = null;
            }
            
            // Also clean up the inline audio element
            if (AudioUnlockUtils.inlineAudioElement) {
              AudioUnlockUtils.inlineAudioElement.onended = null;
              AudioUnlockUtils.inlineAudioElement.src = '';
              try {
                AudioUnlockUtils.inlineAudioElement.load();
              } catch (e) {}
            }
            
            // Make sure the audio context is running
            if (AudioUnlockUtils.audioContext && AudioUnlockUtils.audioContext.state === 'suspended') {
              try {
                AudioUnlockUtils.audioContext.resume().catch(e => {});
              } catch (e) {}
            }
            
            // Clear the reference to the currently playing message
            this.currentlyPlayingMsgDiv = null;
            
            // Update the UI after everything else is done
            requestAnimationFrame(() => {
              // Make sure the state is still marked as finished
              this.messageStateMap.set(messageId, 'FINISHED');
              this.updateAudioControls(msgDiv);
              
              // Do a second update after a short delay to make sure UI is correct
              setTimeout(() => {
                this.messageStateMap.set(messageId, 'FINISHED');
                this.updateAudioControls(msgDiv);
              }, 100);
            });
          }
        });
        
        // Set the audio source AFTER adding all the event listeners
        this.unlockedAudio.src = audioUrl;
        
        // Try to help with autoplay by simulating user interactions
        EventSystem.simulateUserInteractions();
        
        // Function that tries multiple approaches to start playing audio
        const playWithRetry = async () => {
          console.log(`[AudioPlayback] Attempting to play audio with advanced retry mechanism`);
          
          // Function that tries to play the audio multiple times with increasing delays
          const attemptPlay = async (delay = 0, attempt = 1) => {
            // Stop trying after too many attempts and set up a different approach
            if (attempt > 6) {
              console.log('[AudioPlayback] Maximum play attempts reached, setting up user interaction handlers');
              return setupInteractionHandlers();
            }
            
            // Wait for the specified delay before trying again
            await new Promise(resolve => setTimeout(resolve, delay));
            
            try {
              // For attempts after the first one, try simulating user interaction
              if (attempt > 1) {
                EventSystem.simulateUserInteractions();
              }
              
              // Try to play the audio
              await this.unlockedAudio.play();
              console.log(`[AudioPlayback] Audio playback started successfully on attempt ${attempt}`);
            } catch (error) {
              console.warn(`[AudioPlayback] Play attempt ${attempt} failed:`, error);
              
              // Try different approaches depending on which attempt this is
              if (attempt === 1) {
                // On first failure, try unlocking audio again and simulating a click
                AudioUnlockUtils.unlockAudio();
                document.body.click();
              } else if (attempt === 2) {
                // On second failure, try playing a silent sound first
                try {
                  const silent = new Audio("data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA");
                  await silent.play();
                  silent.pause();
                } catch (e) {}
              } else if (attempt === 3) {
                // On third failure, try resuming the audio context
                if (AudioUnlockUtils.audioContext && AudioUnlockUtils.audioContext.state === 'suspended') {
                  try {
                    await AudioUnlockUtils.audioContext.resume();
                  } catch (e) {}
                }
              }
              
              // Try again with a longer delay
              attemptPlay(delay + Math.pow(2, attempt) * 100, attempt + 1);
            }
          };
          
          // Function to set up handlers for real user interactions as a last resort
          const setupInteractionHandlers = () => {
            console.log('[AudioPlayback] Setting up global interaction handlers for playback');
            
            // Function to try playing audio when the user interacts
            const forcePlay = async () => {
              try {
                // Try to unlock audio first
                AudioUnlockUtils.unlockAudio();
                
                // Then try to play the audio
                await this.unlockedAudio.play();
                console.log(`[AudioPlayback] Audio playback started on user interaction`);
              } catch (e) {
                console.error('[AudioPlayback] Even user interaction play failed:', e);
              }
            };
            
            // Set up event handlers for various types of user interactions
            EventSystem.registerForElements(
              [document, document.body, document.documentElement],
              ['click', 'touchstart', 'mousedown', 'keydown'], 
              forcePlay, 
              { once: true }
            );
          };
          
          // Start trying to play the audio with no delay
          attemptPlay(0, 1);
        };
        
        // Start the advanced play mechanism
        await playWithRetry();
        
        // Update the UI controls after attempting to play
        this.updateAudioControls(msgDiv);
      }
    } catch (error) {
      console.error('[AudioPlayback] Error in playMessageAudio:', error);
      this.resetAudioState(msgDiv);
    }
  },

  // Function to pause currently playing audio
  pauseAudio(audioElement) {
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // On mobile, we might need to pause the inline audio element
    if (isMobile && AudioUnlockUtils.inlineAudioElement && (!audioElement || audioElement.paused)) {
      const inlineElement = AudioUnlockUtils.inlineAudioElement;
      if (!inlineElement.paused) {
        console.log('[AudioPlayback] Pausing inline audio element');
        inlineElement.pause();
      }
    }
    
    // Also pause the normal audio element if it exists and is playing
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
    }

    // Update the UI if there's a message currently playing
    if (this.currentlyPlayingMsgDiv) {
      const messageId = this.currentlyPlayingMsgDiv.dataset.messageId;
      if (messageId) {
        // Remember where we paused so we can resume from the same spot
        const currentTime = audioElement ? audioElement.currentTime : 
                           (AudioUnlockUtils.inlineAudioElement ? AudioUnlockUtils.inlineAudioElement.currentTime : 0);
        this.currentlyPlayingMsgDiv.dataset.currentPosition = currentTime.toString();

        // Update the message state to show it's paused
        this.messageStateMap.set(messageId, 'PAUSED');

        // Update the UI to show pause controls
        requestAnimationFrame(() => {
          this.updateAudioControls(this.currentlyPlayingMsgDiv);
        });
      }
    }
  },

  // Function to stop any audio that's currently playing
  stopCurrentlyPlayingAudio(convertToReplay = true) {
    // Do nothing if no message is playing
    if (!this.currentlyPlayingMsgDiv) return;

    // Get the ID of the currently playing message
    const messageId = this.currentlyPlayingMsgDiv.dataset.messageId;
    if (!messageId) return;

    // Remember the message and current position before stopping
    const tempMsgDiv = this.currentlyPlayingMsgDiv;
    const currentTime = this.getCurrentPlaybackTime();
    
    // Clean up all audio resources
    this.releaseAudioResources();

    // Update the state depending on why we're stopping
    if (convertToReplay) {
      // If we're converting to replay mode, mark as finished
      this.messageStateMap.set(messageId, 'FINISHED');
    } else {
      // Otherwise mark as paused and remember position for resuming
      this.messageStateMap.set(messageId, 'PAUSED');
      tempMsgDiv.dataset.currentPosition = currentTime.toString();
    }

    // Update the UI controls
    this.updateAudioControls(tempMsgDiv);
  },

  // Function to find out where in the audio we currently are
  getCurrentPlaybackTime() {
    let currentTime = 0;
    
    // Check if the inline audio element is playing and get its position
    if (AudioUnlockUtils.inlineAudioElement && !AudioUnlockUtils.inlineAudioElement.paused) {
      currentTime = AudioUnlockUtils.inlineAudioElement.currentTime;
    }
    
    // Also check the regular audio element and use whichever is further along
    if (this.unlockedAudio && !this.unlockedAudio.paused) {
      currentTime = Math.max(currentTime, this.unlockedAudio.currentTime);
    }
    
    return currentTime;
  },

  // Function to reset a message back to its initial state
  resetAudioState(msgDiv) {
    // Do nothing if no message is provided
    if (!msgDiv) return;

    // Get the message ID
    const messageId = msgDiv.dataset.messageId;
    if (!messageId) return;

    // Reset the state to idle
    this.messageStateMap.set(messageId, 'IDLE');

    // Show the vocal button and remove loading state
    const vocalButton = msgDiv.querySelector('.vocal-button');
    if (vocalButton) {
      vocalButton.style.display = 'inline-block';
      vocalButton.style.visibility = 'visible';
      vocalButton.classList.remove('loading');
      vocalButton.innerHTML = '<img src="assets/vocal.png" alt="Read aloud" class="vocal-icon">';
    }

    // Remove any playback control buttons
    const controls = msgDiv.querySelectorAll('.stop-voice-button, .play-button, .speed-button');
    controls.forEach(control => control.remove());
  },

  // Function to update the audio control buttons based on playback state
  updateAudioControls(msgDiv) {
    // Do nothing if no message is provided
    if (!msgDiv) return;

    // Get the message ID and current state
    const messageId = msgDiv.dataset.messageId;
    const state = this.messageStateMap.get(messageId) || 'IDLE';
    // Check if the "always read out loud" option is enabled
    const alwaysReadOutLoud = document.getElementById('alwaysReadOutLoud')?.checked || false;
    // Check if this is a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    console.log('[AudioPlayback] Updating audio controls:', { state, messageId });

    // Find all the existing buttons
    const pauseButton = msgDiv.querySelector('.stop-voice-button:not(.replay-button)');
    const playButton = msgDiv.querySelector('.play-button');
    const replayButton = msgDiv.querySelector('.replay-button');
    const speedButton = msgDiv.querySelector('.speed-button');
    const vocalButton = msgDiv.querySelector('.vocal-button');

    // Remove all existing buttons first
    [pauseButton, playButton, replayButton, speedButton].forEach(button => {
      if (button) button.remove();
    });

    // Create new buttons based on the current state
    switch (state) {
      case 'IDLE':
        if (vocalButton) {
          // On mobile, always show the vocal button regardless of settings
          if (alwaysReadOutLoud && !isMobile) {
            vocalButton.style.display = 'none';
            vocalButton.style.visibility = 'hidden';
          } else {
            vocalButton.style.display = 'inline-block';
            vocalButton.style.visibility = 'visible';
            vocalButton.style.pointerEvents = 'auto';
            vocalButton.style.opacity = '0.9';
            vocalButton.style.padding = '5%'; // Increase the clickable area
            
            // Add extra styling for mobile devices
            if (isMobile) {
              vocalButton.style.zIndex = '50';
              
              // Remove any existing touch event handler
              vocalButton.ontouchstart = null;
              
              // Add a touch event handler for better mobile responsiveness
              vocalButton.ontouchstart = (e) => {
                e.preventDefault(); // Prevent the default touch behavior
                e.stopPropagation(); // Stop the event from triggering parent elements
                
                // Simulate a click on the button
                vocalButton.click();
              };
            }
          }
        }
        break;
        
      case 'PLAYING':
        // Create a pause button
        const newPauseButton = document.createElement('button');
        newPauseButton.className = 'stop-voice-button';
        newPauseButton.innerHTML = `<img src="assets/pause.png" alt="Pause" class="mic-off-icon">`;
        newPauseButton.style.zIndex = '30'; // Make it appear above other elements
        newPauseButton.style.padding = '5%'; // Increase the clickable area
        
        // Add a touch event handler for better mobile responsiveness
        newPauseButton.ontouchstart = (e) => {
          e.preventDefault(); // Prevent the default touch behavior
          this.pauseAudio(this.unlockedAudio);
        };
        
        // Add a click event handler
        EventSystem.register(newPauseButton, 'click', () => this.pauseAudio(this.unlockedAudio));
        msgDiv.appendChild(newPauseButton);

        // Create a speed control button
        const newSpeedButton = document.createElement('button');
        newSpeedButton.className = 'speed-button';
        newSpeedButton.textContent = `${this.globalPlaybackRate}x`;
        newSpeedButton.style.color = 'white';
        newSpeedButton.style.zIndex = '30'; // Make it appear above other elements
        newSpeedButton.style.marginLeft = '10px'; // Add some space between buttons
        newSpeedButton.style.padding = '5%'; // Increase the clickable area
        
        // Add extra styling for mobile devices
        if (this.isMobileDevice) {
          newSpeedButton.style.minWidth = '36px';
          newSpeedButton.style.minHeight = '36px';
          newSpeedButton.style.padding = '8px 12px';
          newSpeedButton.style.fontWeight = 'bold';
          newSpeedButton.style.fontSize = '16px';
          newSpeedButton.style.marginLeft = '15px'; // Add more space on mobile
          
          // Add iOS-specific styling
          if (this.isIOS) {
            newSpeedButton.style.WebkitAppearance = 'none';
            newSpeedButton.style.borderRadius = '5px';
          }
        }
        
        // Add a special handler for mobile touch events
        this.setupMobileTouchHandler(newSpeedButton, () => {
          this.cyclePlaybackSpeed(msgDiv);
        });
        
        msgDiv.appendChild(newSpeedButton);

        // Hide the vocal button while audio is playing
        if (vocalButton) {
          vocalButton.style.display = 'none';
          vocalButton.style.visibility = 'hidden';
        }
        break;
        
      case 'PAUSED':
        // Create a play button for resuming playback
        const newPlayButton = document.createElement('button');
        newPlayButton.className = 'play-button';
        newPlayButton.innerHTML = `<img src="assets/play.png" alt="Play" class="mic-off-icon">`;
        newPlayButton.style.zIndex = '30'; // Make it appear above other elements
        newPlayButton.style.padding = '5%'; // Increase the clickable area
        EventSystem.register(newPlayButton, 'click', () => this.resumeAudio(msgDiv, msgDiv.dataset.audioUrl));
        msgDiv.appendChild(newPlayButton);

        // Create a speed control button
        const pausedSpeedButton = document.createElement('button');
        pausedSpeedButton.className = 'speed-button';
        pausedSpeedButton.textContent = `${this.globalPlaybackRate}x`;
        pausedSpeedButton.style.color = 'white';
        pausedSpeedButton.style.zIndex = '30'; // Make it appear above other elements
        pausedSpeedButton.style.marginLeft = '10px'; // Add some space between buttons
        pausedSpeedButton.style.padding = '5%'; // Increase the clickable area
        
        // Add extra styling for mobile devices
        if (this.isMobileDevice) {
          pausedSpeedButton.style.minWidth = '36px';
          pausedSpeedButton.style.minHeight = '36px';
          pausedSpeedButton.style.padding = '8px 12px';
          pausedSpeedButton.style.fontWeight = 'bold';
          pausedSpeedButton.style.fontSize = '16px';
          pausedSpeedButton.style.marginLeft = '15px'; // Add more space on mobile
          
          // Add iOS-specific styling
          if (this.isIOS) {
            pausedSpeedButton.style.WebkitAppearance = 'none';
            pausedSpeedButton.style.borderRadius = '5px';
          }
        }
        
        // Add a special handler for mobile touch events
        this.setupMobileTouchHandler(pausedSpeedButton, () => {
          this.cyclePlaybackSpeed(msgDiv);
        });
        
        msgDiv.appendChild(pausedSpeedButton);

        // Hide the vocal button while audio is paused
        if (vocalButton) {
          vocalButton.style.display = 'none';
          vocalButton.style.visibility = 'hidden';
        }
        break;
        
      case 'FINISHED':
        // Create a replay button for playing the audio again
        const newReplayButton = document.createElement('button');
        newReplayButton.className = 'stop-voice-button replay-button';
        newReplayButton.innerHTML = `<img src="assets/replay.png" alt="Replay" class="mic-off-icon">`;
        newReplayButton.style.zIndex = '50'; // Make it appear above the vocal button
        newReplayButton.style.display = 'flex'; // Make sure it's visible
        newReplayButton.style.visibility = 'visible'; // Make sure it's visible
        newReplayButton.style.opacity = '0.9'; // Make it slightly transparent
        newReplayButton.style.pointerEvents = 'auto'; // Make sure it's clickable
        newReplayButton.style.padding = '5%'; // Increase the clickable area
        EventSystem.register(newReplayButton, 'click', () => this.replayAudio(msgDiv, msgDiv.dataset.audioUrl));
        msgDiv.appendChild(newReplayButton);

        // Completely hide the vocal button in finished state
        if (vocalButton) {
          vocalButton.style.display = 'none !important';
          vocalButton.style.visibility = 'hidden !important';
          vocalButton.style.pointerEvents = 'none';
          vocalButton.style.opacity = '0';
          vocalButton.style.zIndex = '10'; // Put it behind other elements
        }
        break;
    }
  },

  // Function to resume playing paused audio
  async resumeAudio(msgDiv, audioUrl) {
    // Get the position where we paused
    const savedPosition = parseFloat(msgDiv.dataset.currentPosition || '0');
    const messageId = msgDiv.dataset.messageId;
    
    // Update the state to show it's playing
    this.messageStateMap.set(messageId, 'PLAYING');
    this.currentlyPlayingMsgDiv = msgDiv;
    this.updateAudioControls(msgDiv);

    try {
      // Check if we should use the inline element on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && AudioUnlockUtils.inlineAudioElement && audioUrl) {
        // Use the inline element for playback on mobile
        const inlineAudio = AudioUnlockUtils.inlineAudioElement;
        inlineAudio.src = audioUrl;
        
        // Start from the saved position if we have one
        if (savedPosition > 0) {
          inlineAudio.currentTime = savedPosition;
        }
        
        // Set the correct playback speed before playing
        if (inlineAudio.dataset.savedPlaybackRate) {
          inlineAudio.playbackRate = parseFloat(inlineAudio.dataset.savedPlaybackRate);
          console.log(`[AudioPlayback] Resuming with saved rate ${inlineAudio.playbackRate}x`);
        } else {
          inlineAudio.playbackRate = this.globalPlaybackRate;
          console.log(`[AudioPlayback] Resuming with global rate ${this.globalPlaybackRate}x`);
        }
        
        // Try to play using the inline element
        await AudioUnlockUtils.playViaInlineElement(audioUrl);
        
        // Double-check that the playback rate is correct after a short delay
        setTimeout(() => {
          if (inlineAudio.playbackRate !== this.globalPlaybackRate) {
            console.log(`[AudioPlayback] Fixing playback rate after resume from ${inlineAudio.playbackRate}x to ${this.globalPlaybackRate}x`);
            inlineAudio.playbackRate = this.globalPlaybackRate;
          }
        }, 100);
        
        // Set up what happens when the audio finishes
        inlineAudio.onended = () => {
          console.log(`[AudioPlayback] Audio playback ENDED on resume - performing COMPLETE cleanup`);
          this.messageStateMap.set(messageId, 'FINISHED');
          
          // Clean up all audio resources thoroughly
          if (this.unlockedAudio) {
            this.unlockedAudio.onended = null;
            this.unlockedAudio.oncanplay = null;
            this.unlockedAudio.onerror = null;
            this.unlockedAudio.pause();
            this.unlockedAudio.src = '';
            try {
              this.unlockedAudio.load();
            } catch (e) {}
            this.unlockedAudio = null;
          }
          
          // Also clean up the inline audio element
          if (AudioUnlockUtils.inlineAudioElement) {
            AudioUnlockUtils.inlineAudioElement.onended = null;
            AudioUnlockUtils.inlineAudioElement.src = '';
            try {
              AudioUnlockUtils.inlineAudioElement.load();
            } catch (e) {}
          }
          
          // Make sure the audio context is running
          if (AudioUnlockUtils.audioContext && AudioUnlockUtils.audioContext.state === 'suspended') {
            try {
              AudioUnlockUtils.audioContext.resume().catch(e => {});
            } catch (e) {}
          }
          
          // Clear the reference to the currently playing message
          this.currentlyPlayingMsgDiv = null;
          
          // Update the UI controls
          this.updateAudioControls(msgDiv);
        };
      }
      
      // Otherwise use standard Audio element
      this.unlockedAudio = new Audio(audioUrl);
      this.unlockedAudio.playbackRate = this.globalPlaybackRate;

      if (savedPosition > 0) {
        this.unlockedAudio.currentTime = savedPosition;
      }

      // Set up ended handler BEFORE playing to avoid race conditions
      this.unlockedAudio.onended = () => {
        console.log(`[AudioPlayback] Audio playback ENDED on resume - performing COMPLETE cleanup`);
        this.messageStateMap.set(messageId, 'FINISHED');
        
        // CRITICAL: Thorough cleanup specific to when playback COMPLETES
        if (this.unlockedAudio) {
          this.unlockedAudio.onended = null;
          this.unlockedAudio.oncanplay = null;
          this.unlockedAudio.onerror = null;
          this.unlockedAudio.pause();
          this.unlockedAudio.src = '';
          try {
            this.unlockedAudio.load();
          } catch (e) {}
          this.unlockedAudio = null;
        }
        
        // Cleanup inline element too, just to be safe
        if (AudioUnlockUtils.inlineAudioElement) {
          AudioUnlockUtils.inlineAudioElement.onended = null;
          AudioUnlockUtils.inlineAudioElement.src = '';
          try {
            AudioUnlockUtils.inlineAudioElement.load();
          } catch (e) {}
        }
        
        // Resume AudioContext if it exists and is suspended
        if (AudioUnlockUtils.audioContext && AudioUnlockUtils.audioContext.state === 'suspended') {
          try {
            AudioUnlockUtils.audioContext.resume().catch(e => {});
          } catch (e) {}
        }
        
        // Null out the currently playing message div
        this.currentlyPlayingMsgDiv = null;
        
        // Update controls last (after all cleanup is done)
        // Use requestAnimationFrame to ensure the DOM has updated
        requestAnimationFrame(() => {
          // Double check the state is still FINISHED
          this.messageStateMap.set(messageId, 'FINISHED');
          this.updateAudioControls(msgDiv);
          
          // Force a second UI update after a small delay
          setTimeout(() => {
            this.messageStateMap.set(messageId, 'FINISHED');
            this.updateAudioControls(msgDiv);
          }, 100);
        });
      };

      await this.unlockedAudio.play();
    } catch (error) {
      console.error('[AudioPlayback] Error resuming audio:', error);
      this.resetAudioState(msgDiv);
    }
  },

  // Replay audio from start
  async replayAudio(msgDiv, audioUrl) {
    console.log('[AudioPlayback] Replaying audio');
    
    // Store the current playback rate before releasing resources
    const currentRate = this.globalPlaybackRate;
    console.log(`[AudioPlayback] Stored current playback rate: ${currentRate}x for replay`);
    
    // Reset position to beginning
    msgDiv.dataset.currentPosition = '0';
    
    // Release audio resources except for AudioContext
    if (this.unlockedAudio) {
      this.unlockedAudio.onended = null;
      this.unlockedAudio.oncanplay = null;
      this.unlockedAudio.onerror = null;
      try {
        this.unlockedAudio.pause();
      } catch (e) {}
      this.unlockedAudio.src = '';
      try {
        this.unlockedAudio.load();
      } catch (e) {}
      this.unlockedAudio = null;
    }
    
    // Make sure we're using the correct audio URL
    if (!audioUrl && msgDiv.dataset.audioUrl) {
      audioUrl = msgDiv.dataset.audioUrl;
    }
    
    // IMPORTANT: Ensure the global playback rate is preserved
    this.globalPlaybackRate = currentRate;
    console.log(`[AudioPlayback] Explicitly restored playback rate to ${this.globalPlaybackRate}x for replay`);
    
    // If we're using inline audio element on mobile, ensure its rate is correct
    if (this.isMobileDevice && AudioUnlockUtils.inlineAudioElement) {
      AudioUnlockUtils.inlineAudioElement.playbackRate = this.globalPlaybackRate;
      console.log(`[AudioPlayback] Setting inline element playback rate to ${this.globalPlaybackRate}x for replay`);
    }
    
    // Play from beginning
    await this.playMessageAudio(msgDiv, audioUrl);
    
    // Double check playback rate after playback starts (as an additional safeguard)
    setTimeout(() => {
      if (this.unlockedAudio) {
        // Verify the rate matches what we expect
        if (this.unlockedAudio.playbackRate !== this.globalPlaybackRate) {
          console.log(`[AudioPlayback] Playback rate mismatch detected after replay, fixing from ${this.unlockedAudio.playbackRate}x to ${this.globalPlaybackRate}x`);
          this.unlockedAudio.playbackRate = this.globalPlaybackRate;
        }
      }
      if (this.isMobileDevice && AudioUnlockUtils.inlineAudioElement) {
        // Verify inline element rate matches too
        if (AudioUnlockUtils.inlineAudioElement.playbackRate !== this.globalPlaybackRate) {
          console.log(`[AudioPlayback] Inline element playback rate mismatch detected after replay, fixing from ${AudioUnlockUtils.inlineAudioElement.playbackRate}x to ${this.globalPlaybackRate}x`);
          AudioUnlockUtils.inlineAudioElement.playbackRate = this.globalPlaybackRate;
        }
      }
    }, 100); // Short delay to ensure audio has started
  },

  // Cycle through playback speeds
  cyclePlaybackSpeed(msgDiv) {
    this.globalPlaybackRate = this.globalPlaybackRate === 1 ? 1.5 :
                          this.globalPlaybackRate === 1.5 ? 2 : 1;

    // Apply to inline audio element on mobile
    if (this.isMobileDevice && AudioUnlockUtils.inlineAudioElement) {
      AudioUnlockUtils.inlineAudioElement.playbackRate = this.globalPlaybackRate;
      
      // Force the playback rate on iOS - sometimes it doesn't apply immediately
      if (this.isIOS) {
        // Schedule multiple attempts to set the playback rate
        const applyRateToInline = (attempts = 0) => {
          if (attempts > 5) return; // Give up after 5 attempts
          
          try {
            AudioUnlockUtils.inlineAudioElement.playbackRate = this.globalPlaybackRate;
            console.log(`[AudioPlayback] Applied playback rate ${this.globalPlaybackRate}x to inline element (attempt ${attempts+1})`);
          } catch (e) {
            console.warn(`[AudioPlayback] Failed to set playback rate on inline element:`, e);
          }
          
          // Schedule another attempt with increasing delay
          setTimeout(() => applyRateToInline(attempts + 1), 50 * (attempts + 1));
        };
        
        // Start the attempts
        applyRateToInline();
      }
    }

    // Apply to regular audio element
    if (this.unlockedAudio) {
      this.unlockedAudio.playbackRate = this.globalPlaybackRate;
      
      // Force update for iOS
      if (this.isIOS) {
        try {
          // Sometimes temporarily pausing and resuming helps apply the rate
          const wasPlaying = !this.unlockedAudio.paused;
          const currentTime = this.unlockedAudio.currentTime;
          
          if (wasPlaying) {
            this.unlockedAudio.pause();
            // Small timeout before resuming
            setTimeout(() => {
              this.unlockedAudio.currentTime = currentTime;
              this.unlockedAudio.playbackRate = this.globalPlaybackRate;
              this.unlockedAudio.play().catch(e => {
                console.warn('[AudioPlayback] Failed to resume after speed change:', e);
              });
            }, 50);
          }
        } catch (e) {
          console.warn('[AudioPlayback] Error forcing playback rate update:', e);
        }
      }
    }

    // Save the rate to localStorage for persistence
    localStorage.setItem('audioPlaybackRate', this.globalPlaybackRate.toString());

    // Update all speed buttons in the interface
    document.querySelectorAll('.speed-button').forEach(btn => {
      btn.textContent = `${this.globalPlaybackRate}x`;
    });
    
    console.log(`[AudioPlayback] Playback speed changed to ${this.globalPlaybackRate}x`);
  },
  
  // Reset the UI for a message's audio controls
  resetAudioUI(msgDiv) {
    if (!msgDiv) return;

    const messageId = msgDiv.dataset.messageId;
    if (!messageId) return;

    // Update UI based on state
    this.updateAudioControls(msgDiv);
  },
  
  // Setup a handler for the first user interaction 
  setupFirstInteractionHandler() {
    // Use the AudioUnlockUtils' setup method with a callback for handling pending messages
    const interactionState = AudioUnlockUtils.setupFirstInteractionHandler((hasInteracted) => {
      this.hasUserInteracted = hasInteracted;
      
      // If we have any pending messages waiting for autoplay, trigger them now
      if (this.pendingAutoplayMessages.length > 0) {
        console.log(`[AudioPlayback] Playing ${this.pendingAutoplayMessages.length} pending messages`);
        
        // Slight delay to ensure browser has registered the interaction
        setTimeout(() => {
          this.pendingAutoplayMessages.forEach(msgData => {
            const { msgDiv, audioUrl } = msgData;
            if (msgDiv && audioUrl) {
              console.log(`[AudioPlayback] Playing pending audio for message: ${msgDiv.dataset.messageId}`);
              this.playMessageAudio(msgDiv, audioUrl);
            }
          });
          // Clear the queue
          this.pendingAutoplayMessages = [];
        }, 100);
      }
    });
    
    // Store the interaction state checker
    this.isUserInteracted = interactionState.isInteracted;
  },
  
  // Add to pending autoplay queue
  addPendingAutoplay(msgDiv, audioUrl) {
    if (!this.pendingAutoplayMessages) {
      this.pendingAutoplayMessages = [];
    }
    
    console.log(`[AudioPlayback] Adding message to pending autoplay queue: ${msgDiv.dataset.messageId}`);
    this.pendingAutoplayMessages.push({ msgDiv, audioUrl });
    
    // If user has already interacted, play it immediately
    if (this.hasUserInteracted) {
      console.log(`[AudioPlayback] User has already interacted, playing audio immediately`);
      setTimeout(() => {
        this.playMessageAudio(msgDiv, audioUrl);
      }, 100);
    }
  },

  // Add a new method for releasing audio resources
  releaseAudioResources() {
    console.log('[AudioPlayback] Explicitly releasing all audio resources');
    
    // Clean up unlocked audio
    if (this.unlockedAudio) {
      this.unlockedAudio.onended = null;
      this.unlockedAudio.oncanplay = null;
      this.unlockedAudio.onerror = null;
      try {
        this.unlockedAudio.pause();
      } catch (e) {}
      this.unlockedAudio.src = '';
      try {
        this.unlockedAudio.load();
      } catch (e) {}
      this.unlockedAudio = null;
    }
    
    // Clean up inline audio element
    if (AudioUnlockUtils.inlineAudioElement) {
      AudioUnlockUtils.inlineAudioElement.onended = null;
      try {
        AudioUnlockUtils.inlineAudioElement.pause();
      } catch (e) {}
      AudioUnlockUtils.inlineAudioElement.src = '';
      try {
        AudioUnlockUtils.inlineAudioElement.load();
      } catch (e) {}
    }
    
    // Reset current playing state
    if (this.currentlyPlayingMsgDiv) {
      const messageId = this.currentlyPlayingMsgDiv.dataset.messageId;
      if (messageId) {
        this.messageStateMap.set(messageId, 'FINISHED');
        this.updateAudioControls(this.currentlyPlayingMsgDiv);
      }
      this.currentlyPlayingMsgDiv = null;
    }
    
    // CRITICAL: DO NOT close or suspend AudioContext
    // Just leave it in its current state to avoid interfering with microphone access
    
    return true;
  },

  // Prevent context menu on long-press for vocal buttons
  preventContextMenuOnVocalButtons() {
    // Add event delegation on the messages container
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      // Use event delegation to handle all vocal buttons
      messagesContainer.addEventListener('contextmenu', (event) => {
        // Target both the button and any image inside it
        if (event.target.closest('.vocal-button') || 
            (event.target.tagName === 'IMG' && event.target.closest('.vocal-button'))) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }, { capture: true });
      
      // Handle touchstart for vocal buttons using delegation
      messagesContainer.addEventListener('touchstart', (event) => {
        // Check if touch is on vocal button or its icon
        const isVocalButtonTouch = event.target.closest('.vocal-button') || 
            (event.target.tagName === 'IMG' && event.target.closest('.vocal-button'));
        
        if (isVocalButtonTouch) {
          // For vocal buttons, do NOT prevent default or stop propagation
          // This allows the event to reach the vocal button's own listeners
          console.log('[messages touchstart - capture phase] Touch on vocal-button - allowing event to continue');
          
          // Instead of preventing default, just mark the event for tracking
          event.vocalButtonTouched = true;
        }
      }, { passive: true, capture: true });
      
      // Handle touchend for vocal buttons
      messagesContainer.addEventListener('touchend', (event) => {
        // Check if touch is on vocal button or its icon
        const vocalButton = event.target.closest('.vocal-button');
        const isVocalButtonTouch = vocalButton || 
            (event.target.tagName === 'IMG' && event.target.closest('.vocal-button'));
        
        if (isVocalButtonTouch) {
          // For vocal buttons, allow the event to proceed normally first
          console.log('[messages touchend - capture phase] Touch on vocal-button detected');
          
          // Add a slight delay to allow the natural click to happen first
          setTimeout(() => {
            // If the button wasn't clicked naturally, trigger click manually
            if (vocalButton && !event.vocalButtonClicked) {
              console.log('[messages touchend] Triggering click on vocal button');
              vocalButton.click();
            } else if (event.target.tagName === 'IMG') {
              const button = event.target.closest('.vocal-button');
              if (button && !event.vocalButtonClicked) {
                console.log('[messages touchend] Triggering click on vocal button (via image)');
                button.click();
              }
            }
          }, 50);
        }
      }, { passive: true, capture: true });
      
      // Add a click listener to track when vocal buttons are clicked
      messagesContainer.addEventListener('click', (event) => {
        const vocalButton = event.target.closest('.vocal-button');
        if (vocalButton) {
          // Mark that this button was clicked naturally
          event.vocalButtonClicked = true;
        }
      }, { capture: true });
    }
    
    // Also apply to any existing vocal buttons - but with modified behavior
    const existingButtons = document.querySelectorAll('.vocal-button');
    existingButtons.forEach(button => {
      this.applyImprovedTouchHandlingToButton(button);
      
      // Also apply to any images inside these buttons
      const buttonImg = button.querySelector('img');
      if (buttonImg) {
        this.applyImprovedTouchHandlingToImg(buttonImg);
      }
    });
  },
  
  // Improved touch handling for buttons
  applyImprovedTouchHandlingToButton(button) {
    // Prevent only context menu
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }, { capture: true });
    
    // Clear any existing handlers
    button.removeEventListener('touchstart', button._touchstartHandler);
    button.removeEventListener('touchend', button._touchendHandler);
    
    // Add improved touch handlers
    button._touchstartHandler = (event) => {
      // Visual feedback only, don't prevent default
      button.style.opacity = '1'; // Make fully visible when touched
    };
    
    button._touchendHandler = (event) => {
      // Don't prevent default, let the natural click happen
      console.log('[vocal button touchend] Natural touch event');
    };
    
    // Attach the new handlers
    button.addEventListener('touchstart', button._touchstartHandler, { passive: true });
    button.addEventListener('touchend', button._touchendHandler, { passive: true });
    
    // Add CSS to prevent long-press context menu
    button.style.webkitTouchCallout = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.userSelect = 'none';
    button.style.touchAction = 'manipulation';
  },
  
  // Improved touch handling for images
  applyImprovedTouchHandlingToImg(img) {
    // Prevent only context menu on the image
    img.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }, { capture: true });
    
    // Clear any existing handlers
    img.removeEventListener('touchstart', img._touchstartHandler);
    img.removeEventListener('touchend', img._touchendHandler);
    
    // Add CSS to prevent long-press context menu
    img.style.webkitTouchCallout = 'none';
    img.style.webkitUserSelect = 'none';
    img.style.userSelect = 'none';
    img.style.pointerEvents = 'none'; // Let events go through to parent button
    img.setAttribute('draggable', 'false');
  },
  
  setupMutationObserver() {
    // ... existing code ...
  },

  // Add this helper function to improve mobile touch events
  setupMobileTouchHandler(element, callback) {
    if (!element || !callback) return;
    
    // Variables to track touch state
    let touchStarted = false;
    let touchMoved = false;
    let touchTimeout = null;
    
    // Clear any existing handlers to prevent duplicates
    element.ontouchstart = null;
    element.ontouchmove = null;
    element.ontouchend = null;
    element.ontouchcancel = null;
    
    // Handle touch start
    element.ontouchstart = (e) => {
      // e.preventDefault(); 
      e.stopPropagation();
      touchStarted = true;
      touchMoved = false;
      
      // Provide visual feedback
      element.style.opacity = '0.7';
      
      // Set a timeout to detect long press
      touchTimeout = setTimeout(() => {
        // Long press detected, do nothing
        console.log('[AudioPlayback] Long press detected on speed button');
      }, 500);
    };
    
    // Handle touch move
    element.ontouchmove = (e) => {
      if (touchStarted) {
        touchMoved = true;
        // Reset visual feedback if user moved finger
        element.style.opacity = '1.0';
      }
    };
    
    // Handle touch end
    element.ontouchend = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Reset visual feedback
      element.style.opacity = '1.0';
      
      // Clear the timeout
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      
      // Only trigger the callback if the touch wasn't moved (simulating a tap)
      if (touchStarted && !touchMoved) {
        console.log('[AudioPlayback] Clean tap detected on speed button');
        callback();
      }
      
      // Reset state
      touchStarted = false;
      touchMoved = false;
    };
    
    // Handle touch cancel
    element.ontouchcancel = (e) => {
      // Reset visual feedback
      element.style.opacity = '1.0';
      
      // Clear the timeout
      if (touchTimeout) {
        clearTimeout(touchTimeout);
        touchTimeout = null;
      }
      
      // Reset state
      touchStarted = false;
      touchMoved = false;
    };
    
    // Also keep the click handler for non-touch interactions
    EventSystem.register(element, 'click', callback);
  }
}; 