// settings.js - This file handles all the user settings for the chatbot
// Bringing in tools and functions from other files that we'll need
import { texts, currentLanguage, updateUIText } from './shared.js'; // Getting text in different languages

// This line writes a message to the developer console to confirm this file has been loaded
console.log('settings.js module loaded');

// Create the SettingsManager object that contains all our settings-related functions
export const SettingsManager = {
  // This function gets a setting value from the browser's storage
  getSetting(key) {
    // Check if the setting is stored as 'true' and return true or false accordingly
    return localStorage.getItem(key) === 'true';
  },

  // This function saves a setting value to the browser's storage
  setSetting(key, value) {
    // Store the value in the browser's local storage so it's remembered next time
    localStorage.setItem(key, value);
  },

  // This function sets up everything settings-related when the app starts
  initialize() {
    // Load the saved settings from storage
    this.loadSettings();
    // Set up listeners for when settings are changed
    this.setupEventListeners();
    // Update the text in the settings panel to match the current language
    this.updateSettingsText();
  },

  // This function loads all the settings from storage
  loadSettings() {
    // Load each individual setting
    this.loadSetting('alwaysReadOutLoud'); // The setting for automatically reading bot messages
    this.loadSetting('autoTranscribeVoice'); // The setting for automatically sending voice recordings
  },

  // This function loads a specific setting and updates its checkbox
  loadSetting(settingId) {
    // Find the checkbox for this setting
    const checkbox = document.getElementById(settingId);
    if (checkbox) {
      // Set the checkbox to checked or unchecked based on the saved setting
      checkbox.checked = this.getSetting(settingId);
      
      // If this is the 'always read out loud' setting and it's turned on
      if (settingId === 'alwaysReadOutLoud' && checkbox.checked) {
        // Update the visibility of vocal buttons based on this setting
        this.updateVocalButtonsVisibility(true);
      }
    }
  },

  // This function sets up listeners for when settings checkboxes are clicked
  setupEventListeners() {
    // When the 'always read out loud' checkbox changes
    document.getElementById('alwaysReadOutLoud').addEventListener('change', (e) => {
      // Save the new setting value
      this.setSetting('alwaysReadOutLoud', e.target.checked);
      // Update the visibility of vocal buttons based on the new setting
      this.updateVocalButtonsVisibility(e.target.checked);
    });

    // When the 'auto-transcribe voice' checkbox changes
    document.getElementById('autoTranscribeVoice').addEventListener('change', (e) => {
      // Save the new setting value
      this.setSetting('autoTranscribeVoice', e.target.checked);
    });
  },

  // This function updates whether vocal buttons are shown or hidden
  updateVocalButtonsVisibility(isAlwaysReadEnabled) {
    // Find all the vocal buttons in bot messages
    const vocalButtons = document.querySelectorAll('.message.bot .vocal-button');
    
    // For each vocal button
    vocalButtons.forEach(button => {
      // If the button is currently loading, or if there are other audio control buttons
      // visible in the same message, hide this button
      if (button.classList.contains('loading') || 
          button.closest('.message.bot').querySelector('.stop-voice-button') ||
          button.closest('.message.bot').querySelector('.play-button') ||
          button.closest('.message.bot').querySelector('.replay-button')) {
        // Hide the button
        this.hideVocalButton(button);
      } else {
        // Otherwise, show the button
        button.style.display = 'inline-block';
        button.style.visibility = 'visible';
      }
    });
  },

  // This function hides a vocal button
  hideVocalButton(button) {
    // Make the button invisible and non-interactive in several ways
    button.style.display = 'none'; // Remove it from the layout
    button.style.visibility = 'hidden'; // Make it invisible
    button.style.opacity = '0'; // Make it transparent
    button.style.pointerEvents = 'none'; // Make it not respond to clicks
    button.setAttribute('aria-hidden', 'true'); // Hide it from screen readers for accessibility
  },

  // This function shows or hides a vocal button based on the settings
  showVocalButton(button, isAlwaysReadEnabled) {
    // If 'always read out loud' is enabled, hide the button, otherwise show it
    button.style.display = isAlwaysReadEnabled ? 'none' : 'inline-block';
    button.style.visibility = isAlwaysReadEnabled ? 'hidden' : 'visible';
    button.style.opacity = isAlwaysReadEnabled ? '0' : '0.7';
    button.style.pointerEvents = isAlwaysReadEnabled ? 'none' : 'auto';
    if (isAlwaysReadEnabled) {
      // Hide it from screen readers for accessibility if always read is enabled
      button.setAttribute('aria-hidden', 'true');
    } else {
      // Make it visible to screen readers for accessibility if always read is disabled
      button.removeAttribute('aria-hidden');
    }
  },

  // This function updates all the text in the settings panel to match the current language
  updateSettingsText() {
    // Update the title of the settings modal
    const settingsModalTitle = document.querySelector('#settingsModal .modal-header h2');
    if (settingsModalTitle) {
      settingsModalTitle.textContent = texts[currentLanguage].settings;
    }

    // Update the explanations for each setting
    const settingExplanations = document.querySelectorAll('.setting-explanation');
    settingExplanations.forEach(el => {
      // Get which setting this explanation is for
      const settingId = el.getAttribute('data-setting');
      if (settingId) {
        // Get the explanation text in the current language
        const explanationText = texts[currentLanguage][settingId + 'Explanation'];
        if (explanationText) {
          // Update the explanation text
          el.textContent = explanationText;
        }
      }
    });

    // Update the labels for each setting
    const settingLabels = document.querySelectorAll('.setting-label');
    settingLabels.forEach(el => {
      // Get which setting this label is for
      const settingId = el.getAttribute('for');
      if (settingId) {
        // Get the label text in the current language
        const labelText = texts[currentLanguage][settingId];
        if (labelText) {
          // Update the label text
          el.textContent = labelText;
        }
      }
    });

    // Update the title for the general settings section
    const generalSettingsTitle = document.querySelector('.settings-sidebar h3');
    if (generalSettingsTitle) {
      generalSettingsTitle.textContent = texts[currentLanguage].general;
    }

    // Update accessibility labels and descriptions for screen readers
    const alwaysReadOutLoudLabel = document.getElementById('alwaysReadOutLoudLabel');
    if (alwaysReadOutLoudLabel) {
      alwaysReadOutLoudLabel.textContent = texts[currentLanguage].alwaysReadOutLoud;
    }

    const autoTranscribeVoiceLabel = document.getElementById('autoTranscribeVoiceLabel');
    if (autoTranscribeVoiceLabel) {
      autoTranscribeVoiceLabel.textContent = texts[currentLanguage].autoTranscribeVoice;
    }

    const alwaysReadOutLoudDesc = document.getElementById('alwaysReadOutLoudDesc');
    if (alwaysReadOutLoudDesc) {
      alwaysReadOutLoudDesc.textContent = texts[currentLanguage].alwaysReadOutLoudExplanation;
    }

    const autoTranscribeVoiceDesc = document.getElementById('autoTranscribeVoiceDesc');
    if (autoTranscribeVoiceDesc) {
      autoTranscribeVoiceDesc.textContent = texts[currentLanguage].autoTranscribeVoiceExplanation;
    }
  },

  // This function is called when the language changes
  onLanguageChange() {
    // Update all the text in the settings panel to the new language
    this.updateSettingsText();
  }
};

// When the webpage has completely loaded, initialize the settings
document.addEventListener('DOMContentLoaded', () => {
  // This line writes a message to the developer console that we're initializing the settings
  console.log('DOMContentLoaded in settings.js');
  // Initialize the settings
  SettingsManager.initialize();
});