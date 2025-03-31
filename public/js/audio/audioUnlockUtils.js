// This file helps solve problems with playing audio in different web browsers
// audioUnlockUtils.js
// Utilities for handling browser compatibility and audio unlocking

// A system for managing events (like clicks, taps, etc.) to help with audio playback
// Event System - Centralized event management for audio unlocking
export const EventSystem = {
  // A storage space to keep track of all the events we're listening for
  // Track all registered listeners for proper cleanup
  listeners: new Map(),
  
  // Function to set up an event listener (like listening for button clicks)
  // Register an event handler with optional "once" behavior
  register(element, eventType, handler, options = {}) {
    // Create a unique name for this specific event handler so we can find it later
    // Generate a unique ID for this event handler
    const handlerId = `${eventType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Make sure we have a place to store information about this element's events
    // Store reference for cleanup
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    
    // Get the storage for this element's events
    const elementListeners = this.listeners.get(element);
    // Store the details of this event handler
    elementListeners.set(handlerId, { eventType, handler, options });
    
    // Actually set up the event listener on the element
    // Add the actual event listener
    element.addEventListener(eventType, handler, options);
    
    // Give back the unique ID so it can be removed later if needed
    // Return the handler ID for manual removal if needed
    return handlerId;
  },
  
  // Function to set up an event that only happens once
  // Register a one-time event handler
  registerOnce(element, eventType, handler, options = {}) {
    // Add the "once: true" setting to the options
    const modifiedOptions = { ...options, once: true };
    // Use the regular register function with the modified options
    return this.register(element, eventType, handler, modifiedOptions);
  },
  
  // Function to remove a specific event listener using its ID
  // Remove a specific event handler by ID
  unregister(element, handlerId) {
    // Check if we're tracking any events for this element
    if (!this.listeners.has(element)) return false;
    
    // Get all the event listeners for this element
    const elementListeners = this.listeners.get(element);
    // Check if the specific event ID exists
    if (!elementListeners.has(handlerId)) return false;
    
    // Get the details of the event handler
    const { eventType, handler, options } = elementListeners.get(handlerId);
    // Remove the actual event listener
    element.removeEventListener(eventType, handler, options);
    // Remove it from our tracking system
    elementListeners.delete(handlerId);
    
    // Let the caller know we successfully removed it
    return true;
  },
  
  // Function to remove all event listeners of a specific type (like all click events)
  // Remove all event listeners of a specific type from an element
  unregisterByType(element, eventType) {
    // Check if we're tracking any events for this element
    if (!this.listeners.has(element)) return;
    
    // Get all the event listeners for this element
    const elementListeners = this.listeners.get(element);
    // Look through each event listener
    elementListeners.forEach(({ eventType: type, handler, options }, handlerId) => {
      // If it matches the type we're looking for
      if (type === eventType) {
        // Remove the actual event listener
        element.removeEventListener(type, handler, options);
        // Remove it from our tracking system
        elementListeners.delete(handlerId);
      }
    });
  },
  
  // Function to remove all event listeners from an element (clean slate)
  // Remove all event listeners from an element
  unregisterAll(element) {
    // Check if we're tracking any events for this element
    if (!this.listeners.has(element)) return;
    
    // Get all the event listeners for this element
    const elementListeners = this.listeners.get(element);
    // Remove each event listener
    elementListeners.forEach(({ eventType, handler, options }) => {
      element.removeEventListener(eventType, handler, options);
    });
    
    // Remove the element from our tracking system completely
    this.listeners.delete(element);
  },
  
  // Function to set up the same handler function for multiple different events
  // Register same handler for multiple events
  registerMultiple(element, eventTypes, handler, options = {}) {
    // Create an array to store all the handler IDs
    const handlerIds = [];
    // For each event type in the list
    for (const eventType of eventTypes) {
      // Register the handler and save its ID
      handlerIds.push(this.register(element, eventType, handler, options));
    }
    // Return all the IDs
    return handlerIds;
  },
  
  // Function to set up the same handler for multiple events, each happening only once
  // Register same handler for multiple events with once behavior
  registerMultipleOnce(element, eventTypes, handler, options = {}) {
    // Add the "once: true" setting to the options
    const modifiedOptions = { ...options, once: true };
    // Use the regular multiple register function with the modified options
    return this.registerMultiple(element, eventTypes, handler, modifiedOptions);
  },
  
  // Function to set up the same handler on multiple different elements
  // Register same handler on multiple elements
  registerForElements(elements, eventType, handler, options = {}) {
    // Create an array to store all the handler IDs
    const handlerIds = [];
    // For each element in the list
    for (const element of elements) {
      // Register the handler and save its ID
      handlerIds.push(this.register(element, eventType, handler, options));
    }
    // Return all the IDs
    return handlerIds;
  },
  
  // Special function to set up event handlers specifically for unlocking audio
  // Helper for audio unlocking user interactions
  registerUnlockEvents(handler, once = true) {
    // List of elements to listen to (basically everywhere in the document)
    const elements = [document, document.documentElement, document.body, window];
    // List of user interaction events that could unlock audio
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'keydown'];
    
    // For each element in our list
    for (const element of elements) {
      // Set up the handler for all the events
      this.registerMultiple(element, events, handler, { once, passive: true });
    }
  },
  
  // Function to fake user interactions (some browsers require a real user interaction to play audio)
  // Simulate user interactions on document elements (for audio unlocking)
  simulateUserInteractions() {
    // List of elements to simulate events on
    const elements = [document.body, document.documentElement, window];
    // List of events to simulate
    const events = ['mousedown', 'mouseup', 'touchstart', 'touchend', 'click'];
    
    // For each element in our list
    for (const element of elements) {
      // For each event type
      for (const eventType of events) {
        try {
          // Create and trigger a fake event
          element.dispatchEvent(new Event(eventType, { bubbles: true }));
        } catch (e) {
          // Log any errors but continue trying other events
          console.warn(`[EventSystem] Failed to dispatch ${eventType} on ${element}`, e);
        }
      }
    }
  },
  
  // Function to set up standard event listeners for audio elements
  // Register audio element events with standard behaviors
  registerAudioEvents(audioElement, callbacks = {}) {
    // Default functions for common audio events
    const defaultCallbacks = {
      onPlay: () => console.log('[AudioManager] Audio playback started'),
      onPause: () => console.log('[AudioManager] Audio playback paused'),
      onEnded: () => console.log('[AudioManager] Audio playback ended'),
      onError: (e) => console.error('[AudioManager] Audio error:', e),
      onCanPlay: () => console.log('[AudioManager] Audio can play'),
      onTimeUpdate: null
    };
    
    // Combine the provided callbacks with the defaults
    const mergedCallbacks = { ...defaultCallbacks, ...callbacks };
    
    // Create an array to store all the handler IDs
    const handlerIds = [];
    
    // Set up each event type if a callback was provided
    // Register each event with its callback if provided
    if (mergedCallbacks.onPlay) {
      handlerIds.push(this.register(audioElement, 'play', mergedCallbacks.onPlay));
    }
    
    // Set up pause event
    if (mergedCallbacks.onPause) {
      handlerIds.push(this.register(audioElement, 'pause', mergedCallbacks.onPause));
    }
    
    // Set up ended event
    if (mergedCallbacks.onEnded) {
      handlerIds.push(this.register(audioElement, 'ended', mergedCallbacks.onEnded));
    }
    
    // Set up error event
    if (mergedCallbacks.onError) {
      handlerIds.push(this.register(audioElement, 'error', mergedCallbacks.onError));
    }
    
    // Set up various "ready to play" events
    if (mergedCallbacks.onCanPlay) {
      handlerIds.push(this.register(audioElement, 'canplaythrough', mergedCallbacks.onCanPlay));
      handlerIds.push(this.register(audioElement, 'loadeddata', mergedCallbacks.onCanPlay));
      handlerIds.push(this.register(audioElement, 'loadedmetadata', mergedCallbacks.onCanPlay));
    }
    
    // Set up timeupdate event (fires regularly during playback)
    if (mergedCallbacks.onTimeUpdate) {
      handlerIds.push(this.register(audioElement, 'timeupdate', mergedCallbacks.onTimeUpdate));
    }
    
    // Return all the handler IDs
    return handlerIds;
  }
};

// The main toolkit for making audio work across different browsers and devices
// Audio Unlocking Utilities
export const AudioUnlockUtils = {
  // Variables to keep track of the audio unlocking process
  // State for tracking unlock status
  audioUnlocked: false,
  audioUnlockAttempts: 0,
  unlockedAudio: null,
  audioContext: null,
  inlineAudioElement: null,
  
  // The main function that tries several different techniques to unlock audio playback
  // Unified Audio Unlock Method that combines all techniques
  unlockAudio(forceAttempt = false, preventRecursion = false) {
    // Log that we're trying to unlock audio
    console.log('[AudioUnlockUtils] Running unified unlockAudio()');
    
    // If audio is already unlocked, skip unless we're forcing another attempt
    // Skip if audio is already unlocked unless forcing an attempt
    if (this.audioUnlocked && !forceAttempt) {
      console.log('[AudioUnlockUtils] Audio already unlocked, skipping');
      return Promise.resolve(true);
    }
    
    // Don't try too many times to avoid using too much processing power
    // Limit the number of unlock attempts to prevent excessive resource usage
    if (this.audioUnlockAttempts > 5 && !forceAttempt) {
      console.log('[AudioUnlockUtils] Maximum unlock attempts reached');
      return Promise.resolve(false);
    }
    
    // Count this attempt
    this.audioUnlockAttempts++;
    
    // Create a promise (special way to handle things that take time)
    return new Promise(resolve => {
      try {
        // Lists to keep track of temporary elements we create
        // Collection of elements to cleanup later
        const elements = [];
        const audioContexts = [];

        // Check if the user has interacted with the page or if we're forcing an attempt
        // Check if we have had any user interaction or if this is a forced attempt
        const hasUserInteraction = document.querySelector('body.had-user-interaction') !== null || forceAttempt;
        
        // First technique: Use AudioContext API to create and play silent sounds
        // ---- TECHNIQUE 1: AudioContext and BufferSource approach ----
        // Only try this if the user has interacted with the page (browser requirement)
        // Only run AudioContext approach if we have user interaction or it's being forced
        if (hasUserInteraction) {
          try {
            // Get the right AudioContext for the browser
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              // Try to use a shared audio context if available, or create a new one
              // Use shared context if available
              let audioContext;
              if (window.sharedAudioContext) {
                audioContext = window.sharedAudioContext;
                console.log('[AudioUnlockUtils] Using shared AudioContext for unlock');
              } else if (window.AudioManager && window.AudioManager.getSharedAudioContext) {
                audioContext = window.AudioManager.getSharedAudioContext();
                console.log('[AudioUnlockUtils] Using AudioManager.getSharedAudioContext() for unlock');
              } else {
                // Create a new audio context if no shared one exists
                // Create temporary context only if no shared one is available
                audioContext = new AudioContext();
                audioContexts.push(audioContext);
                console.log('[AudioUnlockUtils] Created temporary AudioContext for unlock');
              }
              
              // Try to start the audio context if it's paused
              // Resume the context immediately
              if (audioContext.state === 'suspended') {
                audioContext.resume().catch(e => console.warn('[AudioUnlockUtils] AudioContext resume error:', e));
              }
              
              // Create and play multiple silent sounds
              // Create and play multiple silent buffer sounds for better chances
              // Use the audioContext whether it's shared or temporary
              for (let i = 0; i < 3; i++) {
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
              }
            }
          } catch (e) {
            // Log any errors but continue with other techniques
            console.warn('[AudioUnlockUtils] AudioContext unlock technique failed:', e);
          }
        } else {
          // Skip this technique until the user interacts with the page
          console.log('[AudioUnlockUtils] Skipping AudioContext creation until user interaction');
        }
        
        // Second technique: Create multiple regular audio elements with different settings
        // ---- TECHNIQUE 2: Multiple Audio elements with different configurations ----
        // A short silent sound encoded directly in the code (no need to load a file)
        // Base64 encoded silent MP3
        const silentSoundBase64 = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
        
        // Create several audio elements with different settings to maximize chances
        // Create multiple silent audio elements with different attributes
        for (let i = 0; i < 3; i++) {
          const audio = new Audio();
          elements.push(audio);
          
          // Set all the attributes that might help with autoplay
          // Apply all possible attributes to maximize compatibility
          audio.setAttribute('playsinline', 'true');
          audio.setAttribute('webkit-playsinline', 'true');
          audio.setAttribute('autoplay', 'true');
          audio.preload = 'auto';
          
          // Use different volume settings for each attempt
          // Different volume/muted settings for each attempt
          if (i === 0) {
            audio.muted = true;
            audio.volume = 0;
          } else if (i === 1) {
            audio.muted = false;
            audio.volume = 0.01;
          } else {
            audio.muted = false;
            audio.volume = 0;
          }
          
          // Set the source to our silent sound
          audio.src = silentSoundBase64;
          
          // Try to play the audio
          // Attempt playback with promise handling
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('[AudioUnlockUtils] Audio unlock successful via Audio element');
              this.audioUnlocked = true;
            }).catch(e => {
              console.warn('[AudioUnlockUtils] Audio play failed:', e);
            });
          }
        }
        
        // Third technique: Create a visible audio element in the page
        // ---- TECHNIQUE 3: Create inline DOM audio element (for iOS Safari) ----
        this.createInlineAudioElement();
        
        // Fourth technique: Try to simulate user interactions
        // ---- TECHNIQUE 4: Simulate user interactions ----
        // Only do this if we're not already in a recursive call
        // Only simulate user interactions if we're not in a recursive call
        if (!preventRecursion) {
          EventSystem.simulateUserInteractions();
        }
        
        // Keep a reference to a successful audio element for future use
        // Store the unlocked audio for future use
        if (!this.unlockedAudio) {
          this.unlockedAudio = new Audio(silentSoundBase64);
          this.unlockedAudio.muted = false;
          this.unlockedAudio.volume = 0.1;
          this.unlockedAudio.play().catch(() => {});
        }
        
        // Wait a short time to let all the techniques complete
        // Set a timeout to allow all techniques to complete
        setTimeout(() => {
          // Clean up all the temporary audio elements we created
          // Clean up resources
          elements.forEach(audio => {
            try {
              audio.pause();
              audio.src = '';
            } catch (e) {}
          });
          
          // Clean up any temporary audio contexts
          audioContexts.forEach(ctx => {
            try {
              if (ctx.state !== 'closed') {
                ctx.close().catch(() => {});
              }
            } catch (e) {}
          });
          
          // Log that we're done with this attempt
          console.log('[AudioUnlockUtils] Unified audio unlock attempt completed');
          this.audioUnlocked = true;
          resolve(true);
        }, 500);
        
      } catch (error) {
        // Log any overall errors and consider the attempt failed
        console.error('[AudioUnlockUtils] Error in unlockAudio:', error);
        resolve(false);
      }
    });
  },
  
  // Function to create and initialize the audio context
  // Initialize audio context
  initAudioContext() {
    if (!this.audioContext) {
      try {
        // Try to use a shared audio context or create a new one
        // Use shared context if available, otherwise create a new one
        if (window.sharedAudioContext) {
          console.log('[AudioUnlockUtils] Using shared AudioContext');
          this.audioContext = window.sharedAudioContext;
        } else if (window.AudioManager && window.AudioManager.getSharedAudioContext) {
          console.log('[AudioUnlockUtils] Using AudioManager.getSharedAudioContext()');
          this.audioContext = window.AudioManager.getSharedAudioContext();
        } else {
          console.log('[AudioUnlockUtils] Creating new AudioContext (no shared context available)');
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
      } catch (e) {
        // Log any errors creating the audio context
        console.error('[AudioUnlockUtils] Could not create audio context:', e);
        return null;
      }
    }
    return this.audioContext;
  },
  
  // Set up all the audio unlocking mechanisms when the page loads
  // Setup audio unlocking mechanisms
  setupAudioUnlocking() {
    // Create an audio context that can be used for audio processing
    // Create a persistent audio context for audio unlocking
    if (!this.audioContext) {
      try {
        // Try to use a shared audio context or create a new one
        // Use shared context if available, otherwise create a new one
        if (window.sharedAudioContext) {
          console.log('[AudioUnlockUtils] Using shared AudioContext for setup');
          this.audioContext = window.sharedAudioContext;
        } else if (window.AudioManager && window.AudioManager.getSharedAudioContext) {
          console.log('[AudioUnlockUtils] Using AudioManager.getSharedAudioContext() for setup');
          this.audioContext = window.AudioManager.getSharedAudioContext();
        } else {
          console.log('[AudioUnlockUtils] Creating new AudioContext for setup (no shared context available)');
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Set up event listeners to resume the audio context when the user interacts
        // Resume audio context on user interaction using the EventSystem
        if (this.audioContext.state === 'suspended') {
          EventSystem.registerMultipleOnce(
            document, 
            ['click', 'touchstart', 'touchend', 'mousedown', 'keydown'],
            () => {
              this.audioContext.resume().then(() => {
                console.log('[AudioUnlockUtils] Audio context resumed by user interaction');
              });
            }
          );
        }
      } catch (e) {
        // Log any errors creating the audio context
        console.error('[AudioUnlockUtils] Could not create audio context:', e);
      }
    }
    
    // Create a visible audio element in the page
    // Create an inline audio element in the DOM for iOS Safari
    this.createInlineAudioElement();
    
    // Try to unlock audio immediately
    // Run initial unlock attempt
    this.unlockAudio();
    
    // Set up events to unlock audio when the user interacts with the page
    // Set up unlock events
    EventSystem.registerUnlockEvents(() => {
      this.unlockAudio(false, true);  // Pass preventRecursion=true to avoid infinite loop
    }, true);
    
    // Set up event to handle what happens when the page is hidden
    // Setup handler for document visibility change
    EventSystem.register(document, 'visibilitychange', () => {
      if (document.hidden) {
        // Pause any playing audio when the page is hidden
        // Stop both unlocked audio and inline audio element
        if (this.unlockedAudio && !this.unlockedAudio.paused) {
          this.unlockedAudio.pause();
          this.unlockedAudio.currentTime = 0;
        }
        if (this.inlineAudioElement && !this.inlineAudioElement.paused) {
          this.inlineAudioElement.pause();
          this.inlineAudioElement.currentTime = 0;
        }
      }
    });
    
    // Try to unlock audio when the page finishes loading
    // Register DOMContentLoaded handler
    EventSystem.registerOnce(document, 'DOMContentLoaded', () => {
      this.unlockAudio();
    });
  },
  
  // Create a visible audio element in the page (needed for iOS Safari)
  // Create an inline audio element that's always present in the DOM
  // This helps with iOS Safari autoplay restrictions
  createInlineAudioElement() {
    // Check if we already created this element
    // Check if we already have the element
    let inlineAudio = document.getElementById('inline-audio-element');
    
    if (!inlineAudio) {
      console.log('[AudioUnlockUtils] Creating inline audio element in DOM');
      
      // Create a new audio element
      // Create the element
      inlineAudio = document.createElement('audio');
      inlineAudio.id = 'inline-audio-element';
      inlineAudio.setAttribute('playsinline', 'true');
      inlineAudio.setAttribute('webkit-playsinline', 'true');
      inlineAudio.setAttribute('controls', '');
      inlineAudio.style.position = 'absolute';
      inlineAudio.style.width = '1px';
      inlineAudio.style.height = '1px';
      inlineAudio.style.opacity = '0.01';
      inlineAudio.style.pointerEvents = 'none';
      inlineAudio.style.zIndex = '-1';
      inlineAudio.preload = 'auto';
      
      // Add a silent sound to the audio element
      // Add silent audio source
      inlineAudio.src = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
      
      // Add the audio element to the page (it needs to be in the page to work)
      // Add to the DOM - must be added to have an effect on iOS
      document.body.appendChild(inlineAudio);
      
      // Try to play the audio right away
      inlineAudio.play().then(() => {
        console.log('[AudioUnlockUtils] Inline audio element successfully played');
        inlineAudio.pause();
        inlineAudio.currentTime = 0;
      }).catch(e => {
        console.warn('[AudioUnlockUtils] Inline audio element autoplay failed:', e);
      });
      
      // Set up event listeners to play the audio when the user interacts
      // Setup event listener for user interaction to play using the EventSystem
      EventSystem.registerMultipleOnce(
        document,
        ['touchstart', 'click', 'mousedown'],
        () => {
          inlineAudio.play().then(() => {
            setTimeout(() => {
              inlineAudio.pause();
              inlineAudio.currentTime = 0;
            }, 1000);
          }).catch(() => {});
        }
      );
      
      // Save a reference to the audio element
      // Store reference
      this.inlineAudioElement = inlineAudio;
    }
    
    return inlineAudio;
  },
  
  // Function to play audio using the inline element (especially helpful on mobile)
  // Use the inline element for actual playback on mobile
  playViaInlineElement(audioUrl) {
    return new Promise((resolve, reject) => {
      try {
        // Find our inline audio element
        const inlineAudio = document.getElementById('inline-audio-element');
        if (!inlineAudio) {
          console.warn('[AudioUnlockUtils] No inline audio element found');
          return reject('No inline element');
        }
        
        console.log('[AudioUnlockUtils] Attempting to play via inline element');
        
        // Remove any old event handlers
        // Clear any previous handlers
        const oldHandlers = inlineAudio._eventHandlers || {};
        if (oldHandlers.play) inlineAudio.removeEventListener('play', oldHandlers.play);
        if (oldHandlers.error) inlineAudio.removeEventListener('error', oldHandlers.error);
        if (oldHandlers.ended) inlineAudio.removeEventListener('ended', oldHandlers.ended);
        if (oldHandlers.pause) inlineAudio.removeEventListener('pause', oldHandlers.pause);
        
        // Define function for when audio starts playing
        // Set up event handlers
        const onPlay = () => {
          console.log('[AudioUnlockUtils] Inline element playback started');
          inlineAudio.dataset.isPlaying = 'true';
          
          // Try to set the playback speed if available
          // Try to access the AudioPlaybackManager if available in the global scope
          if (window.AudioPlaybackManager && window.AudioPlaybackManager.globalPlaybackRate) {
            // Use a previously saved playback rate or the global setting
            // Restore saved playback rate if available
            if (inlineAudio.dataset.savedPlaybackRate) {
              inlineAudio.playbackRate = parseFloat(inlineAudio.dataset.savedPlaybackRate);
              console.log(`[AudioUnlockUtils] Restored saved playback rate: ${inlineAudio.playbackRate}x`);
            } else {
              inlineAudio.playbackRate = window.AudioPlaybackManager.globalPlaybackRate;
              console.log(`[AudioUnlockUtils] Setting inline playback rate to ${window.AudioPlaybackManager.globalPlaybackRate}x`);
            }
          }
          
          resolve();
        };
        
        // Define function for when audio is paused
        const onPause = () => {
          console.log('[AudioUnlockUtils] Inline element playback paused');
          inlineAudio.dataset.isPlaying = 'false';
          // Remember the current playback speed for next time
          // Store the current playback rate when pausing
          if (inlineAudio.playbackRate) {
            inlineAudio.dataset.savedPlaybackRate = inlineAudio.playbackRate;
          }
        };
        
        // Define function for when audio finishes playing
        const onEnded = () => {
          console.log('[AudioUnlockUtils] Inline element playback ended');
          inlineAudio.dataset.isPlaying = 'false';
        };
        
        // Define function for when there's an error with the audio
        const onError = (e) => {
          console.error('[AudioUnlockUtils] Inline element playback error', e);
          inlineAudio.dataset.isPlaying = 'false';
          reject(e);
          cleanup();
        };
        
        // Function to remove all these event listeners when done
        const cleanup = () => {
          inlineAudio.removeEventListener('play', onPlay);
          inlineAudio.removeEventListener('error', onError);
          inlineAudio.removeEventListener('ended', onEnded);
          inlineAudio.removeEventListener('pause', onPause);
          if (inlineAudio._eventHandlers) {
            inlineAudio._eventHandlers = {};
          }
        };
        
        // Save references to the event handlers so they can be removed later
        // Store references to handlers for future cleanup
        inlineAudio._eventHandlers = {
          play: onPlay,
          error: onError,
          ended: onEnded,
          pause: onPause
        };
        
        // Set up the event listeners
        // Register handlers
        inlineAudio.addEventListener('play', onPlay);
        inlineAudio.addEventListener('error', onError);
        inlineAudio.addEventListener('ended', onEnded);
        inlineAudio.addEventListener('pause', onPause);
        
        // Make sure all the attributes are set for maximum compatibility
        // Ensure autoplay attributes are set
        inlineAudio.setAttribute('playsinline', 'true');
        inlineAudio.setAttribute('webkit-playsinline', 'true');
        inlineAudio.setAttribute('autoplay', 'true');
        
        // Change the audio source and try to play it
        // Update source and play
        inlineAudio.src = audioUrl;
        inlineAudio.play().catch(e => {
          console.error('[AudioUnlockUtils] Failed to play inline audio:', e);
          inlineAudio.dataset.isPlaying = 'false';
          reject(e);
        });
        
      } catch (e) {
        // Handle any unexpected errors
        console.error('[AudioUnlockUtils] Exception using inline element', e);
        reject(e);
      }
    });
  },
  
  // Function to detect the very first time a user interacts with the page
  // Setup handler for first user interaction 
  setupFirstInteractionHandler(callback) {
    // Keep track of whether we've detected user interaction
    // Flag to track if we've already had first interaction
    let hasUserInteracted = false;
    
    // Function to run when the first interaction happens
    // One-time handler for the first interaction
    const firstInteractionHandler = () => {
      if (hasUserInteracted) return;
      
      console.log('[AudioUnlockUtils] First user interaction detected - activating audio');
      hasUserInteracted = true;
      
      // Add a CSS class to the body element to remember this
      // Mark the body as having had interaction (for future unlockAudio calls)
      document.body.classList.add('had-user-interaction');
      
      // Try to unlock audio playback
      // Run audio unlock function
      this.unlockAudio(false, true);  // Pass preventRecursion=true to avoid infinite loop
      
      // Run any additional function provided by the caller
      // Call the provided callback if any
      if (typeof callback === 'function') {
        callback(hasUserInteracted);
      }
    };
    
    // Set up event listeners for various user interactions
    // Register the handler for various interaction events using the EventSystem
    EventSystem.registerMultipleOnce(
      document,
      ['click', 'touchstart', 'mousedown', 'keydown', 'scroll'],
      firstInteractionHandler
    );
    
    console.log('[AudioUnlockUtils] First interaction handler set up');
    
    // Provide a way for other code to check if interaction has happened
    // Return the interaction state so the caller can check it
    return {
      isInteracted: () => hasUserInteracted
    };
  }
}; 