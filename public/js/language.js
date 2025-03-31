// language.js - This file handles all the language-related functions for the chatbot
// Bringing in tools and functions from other files that we'll need
import { currentLanguage, setCurrentLanguage, texts, updateUIText, appendMessage } from './shared.js'; // Getting language functions and text
import { AudioManager } from './audiomanager.js'; // Getting audio tools
import { franc } from 'https://cdn.jsdelivr.net/npm/franc-min@6.2.0/+esm'; // Getting a language detection tool from the internet

// This line writes a message to the developer console to confirm this file has been loaded
console.log('language.js module loaded');

// Language Configuration - This is where we define which languages the app supports
export const SUPPORTED_LANGUAGES = {
  en: { // English language settings
    name: 'English', // The display name of the language
    speechLang: 'en-US', // The code used for text-to-speech in this language
    shortGreetings: ['hello', 'hi', 'hey'] // Common short greetings in English
  },
  fr: { // French language settings
    name: 'Français', // The display name of the language
    speechLang: 'fr-FR', // The code used for text-to-speech in this language
    shortGreetings: ['bonjour', 'salut'] // Common short greetings in French
  },
  es: { // Spanish language settings
    name: 'Español', // The display name of the language
    speechLang: 'es-ES', // The code used for text-to-speech in this language
    shortGreetings: ['hola', 'buenos dias', 'buenas'] // Common short greetings in Spanish
  }
};

// This maps the codes that the franc language detector uses to our supported language codes
// For example, franc uses 'fra' for French, but we use 'fr'
const LANGUAGE_MAPPING = {
  'fra': 'fr',  // French - maps franc's 'fra' code to our 'fr' code
  'eng': 'en',  // English - maps franc's 'eng' code to our 'en' code
  'spa': 'es'   // Spanish - maps franc's 'spa' code to our 'es' code
};

// Create the LanguageManager object that contains all our language-related functions
export const LanguageManager = {
  // This function gets the right speech language code for the current language
  getCurrentSpeechLang() {
    return SUPPORTED_LANGUAGES[currentLanguage].speechLang;
  },

  // This function tries to detect what language a text is written in
  detectLanguage(text) {
    // If there's no text or it's just spaces, we can't detect the language
    if (!text || text.trim() === '') return null;

    // First, check if it's a simple greeting by making it lowercase
    const lowerText = text.trim().toLowerCase();

    // Check if the text matches any of the short greetings in our supported languages
    for (const [lang, config] of Object.entries(SUPPORTED_LANGUAGES)) {
      if (config.shortGreetings.includes(lowerText)) {
        // If it matches a greeting, return that language code
        return lang;
      }
    }

    // For longer text, use the franc language detection tool
    if (text.length >= 12) { // Only try to detect if the text is at least 12 characters
      try {
        // Use franc to detect the language
        const detectedCode = franc(text);
        // Convert the franc code to our code
        const detectedLang = LANGUAGE_MAPPING[detectedCode];
        
        // Special case: If we're currently in French and franc thinks it's English,
        // but the text is short, stick with French (to avoid too many false switches)
        if (currentLanguage === 'fr' && detectedLang === 'en' && text.length < 40) {
          console.log("Not switching from French to English - text too short");
          return null;
        }

        // Return the detected language
        return detectedLang;
      } catch (error) {
        // If there's an error with language detection, log it
        console.error('Language detection error:', error);
      }
    }

    // If we couldn't detect the language, return null
    return null;
  },

  // This function sets up everything language-related when the app starts
  initialize() {
    // Get the saved language from the browser's storage, or use French as default
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'fr';
    // Set the language to what we found
    this.setLanguage(savedLanguage);

    // Update the language dropdown in the interface to show the current language
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.value = savedLanguage;
    }

    // Update the HTML document's language attribute for accessibility
    document.documentElement.lang = savedLanguage;
    // Update all text in the interface to the selected language
    updateUIText();
    
    // Add the welcome message if it's not already there
    if (!document.querySelector('.welcome-message')) {
      this.appendWelcomeMessage();
    }

    // Set up automatic language detection based on what the user types
    this.setupLanguageAutoDetection();
  },

  // This function changes the current language
  setLanguage(newLang) {
    // Update the current language in the shared.js file
    setCurrentLanguage(newLang);
    // Save the language choice in the browser's storage
    localStorage.setItem('selectedLanguage', newLang);
    // Update the HTML document's language attribute for accessibility
    document.documentElement.lang = newLang;
    // Update all text in the interface to the new language
    updateUIText();
    // Run any other language change functions
    this.onLanguageChange();
  },

  // This function is called when the user changes the language in the dropdown
  changeLanguage() {
    // Get the language selected in the dropdown
    const newLang = document.getElementById('languageSelect').value;
    // Set the language to what the user selected
    this.setLanguage(newLang);
  },

  // This function sets up automatic language detection based on what the user types
  setupLanguageAutoDetection() {
    // Find the input box
    const userInput = document.getElementById('userInput');
    // If we can't find it, stop here
    if (!userInput) return;

    // Create a variable to store a timer
    let languageDetectionTimeout;

    // When the user types in the input box
    userInput.addEventListener('input', () => {
      // Get what the user has typed
      const text = userInput.value;
      // Clear any previous detection timer
      clearTimeout(languageDetectionTimeout);

      // Start a new timer to detect the language after a short delay
      languageDetectionTimeout = setTimeout(() => {
        // Try to detect the language
        const detectedLang = this.detectLanguage(text);

        // If we detected a language and it's different from the current one
        if (detectedLang && detectedLang !== currentLanguage) {
          // Update the language dropdown to show the detected language
          document.getElementById('languageSelect').value = detectedLang;
          // Change the language to the detected one
          this.changeLanguage();
          // Show a notification to the user that the language has changed
          this.showLanguageChangeNotification(detectedLang);
        }
      }, 500); // Wait 500 milliseconds before detecting (to avoid detecting on every keystroke)
    });
  },

  // This function shows a notification when the language has been automatically changed
  showLanguageChangeNotification(lang) {
    // Find the notification element or create it if it doesn't exist
    const notification = document.getElementById('languageChangeNotification') || 
      this.createLanguageChangeNotification();

    // Set the text of the notification to say which language we switched to
    notification.textContent = `Switched to ${SUPPORTED_LANGUAGES[lang].name}`;
    // Make the notification visible
    notification.style.opacity = '1';

    // After 2 seconds, make the notification fade away
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 2000);
  },

  // This function creates the notification element if it doesn't exist
  createLanguageChangeNotification() {
    // Create a new div element
    const notification = document.createElement('div');
    // Give it a unique ID so we can find it later
    notification.id = 'languageChangeNotification';
    // Give it a CSS class for styling
    notification.className = 'language-change-notification';
    // Add it to the page
    document.body.appendChild(notification);
    // Return the new element
    return notification;
  },

  // This function adds the welcome message to the chat
  appendWelcomeMessage() {
    // If we've already added the welcome message, don't add it again
    if (this.welcomeMessageAppended) return;
    // Mark that we've added the welcome message
    this.welcomeMessageAppended = true;
    
    // Get the welcome text in the current language, or use a default if not found
    const welcomeText = texts[currentLanguage]?.welcomeText || 'Welcome to Meit Ai!';
    
    // If there isn't already a welcome message
    if (!document.querySelector('.welcome-message')) {
      // Add the welcome message to the chat as a bot message (the true parameters mark it as a welcome message)
      appendMessage(welcomeText, 'bot', true, true);
    }
  },

  // This function updates the welcome message when the language changes
  updateWelcomeMessage() {
    // Find the welcome message element
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
      // Find the span inside the welcome message
      const span = welcomeMsg.querySelector('span');
      if (span) {
        // Format the welcome text to handle markdown-style formatting
        // **text** becomes bold text, and \n becomes a line break
        const formattedText = texts[currentLanguage].welcomeText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        // Set the HTML of the span to the formatted text
        span.innerHTML = formattedText;
      }
    }
  },

  // This function is called when the language changes
  onLanguageChange() {
    // Update the welcome message with the new language
    this.updateWelcomeMessage();
  }
};

// Function to detect if the device is Android
const isAndroidDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('android') && !userAgent.includes('iphone') && !userAgent.includes('ipad');
};

// Android custom dropdown functionality
const initAndroidLanguageSelect = () => {
  // Only proceed if we're on Android
  if (!isAndroidDevice()) return;

  // Add Android class to body
  document.body.classList.add('android-device');

  const androidSelect = document.getElementById('androidLanguageSelect');
  if (!androidSelect) return;

  const button = androidSelect.querySelector('.android-language-button');
  const dropdown = androidSelect.querySelector('.android-language-dropdown');
  const selectedText = androidSelect.querySelector('.selected-language');
  const options = androidSelect.querySelectorAll('li[role="option"]');

  // Set initial selected language
  const currentLang = localStorage.getItem('selectedLanguage') || 'fr';
  const currentOption = Array.from(options).find(opt => opt.getAttribute('data-value') === currentLang);
  if (currentOption) {
    selectedText.textContent = currentOption.textContent;
    options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
    currentOption.setAttribute('aria-selected', 'true');
  }

  // Toggle dropdown
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !isExpanded);
    dropdown.classList.toggle('show');

    // Focus the selected option when opening
    if (!isExpanded) {
      const selectedOption = dropdown.querySelector('[aria-selected="true"]');
      if (selectedOption) {
        selectedOption.focus();
      }
    }
  });

  // Handle option selection
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const value = option.getAttribute('data-value');
      const text = option.textContent;

      // Update button text
      selectedText.textContent = text;

      // Update aria-selected
      options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
      option.setAttribute('aria-selected', 'true');

      // Hide dropdown
      dropdown.classList.remove('show');
      button.setAttribute('aria-expanded', 'false');

      // Update the native select (for consistency)
      const nativeSelect = document.getElementById('languageSelect');
      if (nativeSelect) {
        nativeSelect.value = value;
      }

      // Trigger language change
      LanguageManager.setLanguage(value);
    });

    // Add touch event handling
    option.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.target.click();
    });
  });

  // Close dropdown when clicking/touching outside
  document.addEventListener('click', (e) => {
    if (!androidSelect.contains(e.target)) {
      dropdown.classList.remove('show');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('touchend', (e) => {
    if (!androidSelect.contains(e.target)) {
      dropdown.classList.remove('show');
      button.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle keyboard navigation
  dropdown.addEventListener('keydown', (e) => {
    const items = Array.from(options);
    const currentItem = document.activeElement;
    const currentIndex = items.indexOf(currentItem);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          items[currentIndex - 1].focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          items[currentIndex + 1].focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        currentItem.click();
        break;
      case 'Escape':
        e.preventDefault();
        dropdown.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
        break;
    }
  });
};

// Initialize Android dropdown when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initAndroidLanguageSelect();
});