// shared.js - This file contains shared functions and variables used across the entire application
// Bringing in tools and functions from other files that we'll need
import { scrollToBottom } from './chatinterface.js'; // Getting the function to scroll to the bottom of the chat
import { UtilityManager } from './utility.js'; // Getting helpful utility functions
// This line writes a message to the developer console to confirm this file has been loaded
console.log('shared.js loaded'); // ADDED LOG

// Setting the default language to French
export let currentLanguage = 'fr';

// Creating a variable to store the chat messages container
// Starting with null because the HTML might not be loaded yet
let messagesDiv = null;

// ImageCache manages pre-loading and storing images to make the app faster
// This prevents having to load the same images over and over
const ImageCache = {
    botLogo: null, // Will store the chatbot's logo
    vocalImg: null, // Will store the speak/vocal button image
    loadingImg: null, // Will store the loading animation image

    // This function loads all the images when the app starts
    initialize() {
        // Load the bot logo image and store it
        this.botLogo = this.createImage('assets/favicon.png', '', 'message-logo');
        // Hide it from screen readers since it's decorative
        this.botLogo.setAttribute('aria-hidden', 'true');
        
        // Load the vocal button image and store it
        this.vocalImg = this.createImage('assets/vocal.png', '', 'vocal-icon');
        // Hide it from screen readers since it's decorative
        this.vocalImg.setAttribute('aria-hidden', 'true');
        
        // Load the loading animation image and store it
        this.loadingImg = this.createImage('assets/loading.png', 'Loading...', 'vocal-icon');
    },

    // This helper function creates an image with the given properties
    createImage(src, alt, className) {
        const img = new Image(); // Create a new image element
        img.src = src; // Set the source (file path)
        img.alt = alt; // Set the alternative text for accessibility
        img.className = className; // Set the CSS class for styling
        return img; // Return the created image
    },

    // This function returns a copy of a stored image
    getImage(type) {
        return this[type]?.cloneNode(true); // The ? means "only if it exists"
    }
};

// When the webpage has completely loaded, find the messages div and initialize the image cache
document.addEventListener('DOMContentLoaded', () => {
    // Find the container where messages will be displayed
    messagesDiv = document.getElementById('messages');
    // Load all the images into the cache
    ImageCache.initialize();
    // This line writes a message to the developer console about finding the messages div
    console.log('Messages div initialized:', messagesDiv);
});

// This function changes the current language
export function setCurrentLanguage(lang) {
    currentLanguage = lang;
}

// This function adds a new message to the chat
export function appendMessage(text, sender, isWelcome = false, shouldScroll = true) {
    // If we haven't found the messages container yet, try to find it now
    if (!messagesDiv) {
        messagesDiv = document.getElementById('messages');
    }

    // Create a variable to store the message div we'll create
    let msgDiv;
    
    // If the message is from the bot
    if (sender === 'bot') {
        // Use the bot message template from the HTML
        const template = document.getElementById('botMessageTemplate');
        // Clone the template to create a new message
        msgDiv = template.content.cloneNode(true).querySelector('.message.bot');
        
        // Replace the placeholder logo with our cached logo image
        const logoImg = msgDiv.querySelector('.message-logo');
        if (logoImg && ImageCache.getImage('botLogo')) {
            logoImg.parentNode.replaceChild(ImageCache.getImage('botLogo'), logoImg);
        }
        
        // Replace the placeholder vocal button image with our cached image
        const vocalImg = msgDiv.querySelector('.vocal-icon');
        if (vocalImg && ImageCache.getImage('vocalImg')) {
            vocalImg.parentNode.replaceChild(ImageCache.getImage('vocalImg'), vocalImg);
        }
        
        // Format the text, adding bold for text between ** and line breaks for \n
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Make text between ** bold
            .split('\n')
            .join('<br>'); // Convert newlines to HTML line breaks
        
        // Set the formatted text as the message content
        msgDiv.querySelector('span').innerHTML = formattedText;
        
        // Store the text length as a data attribute for decision making about autoplay
        msgDiv.dataset.textLength = text.length.toString();
        
        // Generate a unique ID for this message so we can find it later
        msgDiv.dataset.messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // If this is the welcome message, add special styling
        if (isWelcome) {
            // Add a special class to identify it as the welcome message
            msgDiv.classList.add('welcome-message');
            // Preserve whitespace in the welcome message
            msgDiv.querySelector('span').style.whiteSpace = 'pre-wrap';
        }

        // Find the vocal button that reads the message out loud
        const vocalButton = msgDiv.querySelector('.vocal-button');
        console.log('[appendMessage] vocalButton element:', vocalButton); // ADD THIS LOG
        
        // Create a function to handle when the vocal button is clicked
        if (vocalButton) {
            console.log('[appendMessage] vocalButton found, attaching event listeners...'); // ADD THIS LOG
            
            const handleVocalButtonPress = async () => {
                console.log('handleVocalButtonPress triggered');
                try {
                    // For welcome message, always use current language text instead of the original
                    const textToSpeak = isWelcome ? texts[currentLanguage].welcomeText : text;
                    
                    // Get the AudioManager reference in a way that avoids circular dependencies
                    const AM = window.AudioManager || (typeof AudioManager !== 'undefined' ? AudioManager : null);
                    if (AM) {
                        // Mark the message as being handled to prevent duplicate readings
                        if (!msgDiv.dataset.audioHandled) {
                            msgDiv.dataset.audioHandled = 'true';
                        }
                        
                        // Mark as auto-read triggered to prevent duplicates
                        msgDiv.dataset.autoReadTriggered = 'true';
                        
                        // Use AudioManager to speak the text
                        await AM.speakTTS(textToSpeak, msgDiv);
                    }
                    
                } catch (error) {
                    // If there's an error, log it and reset the button
                    console.error('[Client TTS] Error:', error);
                    vocalButton.classList.remove('loading');
                    vocalButton.innerHTML = '';
                    vocalButton.appendChild(ImageCache.getImage('vocalImg'));
                }
            };
            
            // Add a click event listener to the vocal button
            console.log('[appendMessage] Attaching click listener to vocalButton'); // ADD THIS LOG
            vocalButton.addEventListener('click', handleVocalButtonPress);
            console.log('[appendMessage] Click listener attached'); // ADD THIS LOG
            
            // Add a touch event listener for better response on mobile devices
            console.log('[appendMessage] Attaching touchstart listener to vocalButton'); // ADD THIS LOG
            vocalButton.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent default touch behavior like scrolling
                handleVocalButtonPress(); // Run the same function as for clicks
            });
            console.log('[appendMessage] Touchstart listener attached'); // ADD THIS LOG
        } else {
            console.log('[appendMessage] vocalButton NOT FOUND in msgDiv!'); // ADD THIS LOG
        }
        
        // Check if auto-read is enabled and the message isn't the welcome message
        const alwaysReadOutLoud = document.getElementById('alwaysReadOutLoud')?.checked;
        if (alwaysReadOutLoud && !isWelcome) {
            // Don't auto-read if this message was created through the API response flow
            // because the API response will handle reading it itself
            if (!window.pendingBotResponse) {
                // Get the AudioManager reference in a way that avoids circular dependencies
                const AM = window.AudioManager || (typeof AudioManager !== 'undefined' ? AudioManager : null);
                if (AM && AM.ttsManager && typeof AM.ttsManager.autoReadBotMessage === 'function') {
                    // Use the AudioManager to automatically read the message
                    AM.ttsManager.autoReadBotMessage(msgDiv, text, isWelcome, AM.audioPlaybackManager);
                }
            }
        }
    } else if (sender === 'user') {
        // If the message is from the user, create a simpler message div
        msgDiv = document.createElement('div');
        // Add the user message styling class
        msgDiv.className = 'message user';
        // Set the message text
        msgDiv.innerHTML = `<span>${text}</span>`;
    }
    
    // Add the new message to the chat
    messagesDiv.appendChild(msgDiv);

    // If we should scroll after adding the message
    if (shouldScroll) {
        // For bot messages, we need special scrolling logic
        if (sender === 'bot') {
            // Find the last user message (the one this bot is responding to)
            const userMessages = document.querySelectorAll('.message.user');
            const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1] : null;

            // Check if we need to scroll to user message
            const botMessageHeight = msgDiv.offsetHeight;
            const visibleHeight = document.querySelector('.chat-container').offsetHeight;

            // For desktop computers, use a lower threshold to ensure user's question is always visible
            if (window.innerWidth > 768 && lastUserMessage && botMessageHeight > visibleHeight * 0.4) {
                // Scroll to make the user's message visible at the top
                lastUserMessage.scrollIntoView({ behavior: 'instant', block: 'start' });
                // Add extra space by scrolling up slightly
                document.querySelector('.chat-container').scrollBy(0, -20);
            }
            // For mobile devices, use different logic
            else if (window.innerWidth <= 768 && lastUserMessage) {
                // If the answer is large (250+ characters), scroll to keep user's question at top
                if (text.length >= 250) {
                    // Scroll to make the user's message visible at the top
                    lastUserMessage.scrollIntoView({ behavior: 'instant', block: 'start' });
                    // Add extra space by scrolling up slightly
                    document.querySelector('.chat-container').scrollBy(0, -15);
                } else if (botMessageHeight > visibleHeight * 0.6) {
                    // For shorter messages that are still tall, also scroll to the user's message
                    lastUserMessage.scrollIntoView({ behavior: 'instant', block: 'start' });
                    // Add extra space by scrolling up slightly
                    document.querySelector('.chat-container').scrollBy(0, -15);
                } else {
                    // For small messages, just scroll to the bottom
                    UtilityManager.scrollToBottom(true); // Instant scroll to bottom
                }
            } else {
                // If there's no last user message or the message is small, scroll to bottom
                UtilityManager.scrollToBottom(true); // Instant scroll to bottom
            }
        } else {
            // For user messages, always scroll to bottom
            UtilityManager.scrollToBottom(true); // Instant scroll to bottom
        }
    }

    // Return the created message div so other functions can use it
    return msgDiv;
}

// This object contains all the text in different languages
export const texts = {
    en: { // English text
        questionPlaceholder: "Example: Tell me about...", // Placeholder in the input box
        thinkingText: "The system is thinking...", // Text shown when the bot is thinking
        errorText: "Internal error, please try again.", // Error message
        welcomeText: `Hello! I am Meit Ai, your virtual assistant from Mei Tai Cacao Lodge.🌿✨ 
<small-break>Ask me a specific question (written, or via the microphone) or ask about one of the following themes: <small-break>
<p>**• About us and Mei Tai ℹ️**
**• Important to Know ⚠️**
**• Check-in / Check-out 🕒**
**• The Cafeteria 'My Time' ☕**
**• Our chocolat 🍫**
**• App to eat dinner 🍖**
**• Pool 🏊‍♂️**
**• Internet 🌐**
**• Payment 💳**
**• Fauna & Flora 🌿**
**• Activities Inside Mei Tai   **
**• Activities Outside Mei Tai 🏞️**
**• Nearby Restaurants 🍴**<small-break>
<small><p><em>The information provided by this chatbot is for informational purposes only and does not constitute a contractual commitment.<em>`, // Welcome message
        disclaimerText: "Meit Ai can make mistakes. Check important information.", // Disclaimer text
        operaWarning: "⚠️ This browser (Opera) does not support voice recognition. For a complete experience, please use Chrome, Edge or Safari.", // Warning for Opera users
        settings: "Settings", // Settings title
        general: "General", // General settings section title
        alwaysReadOutLoud: "Always read out loud", // Always read out loud setting label
        autoTranscribeVoice: "Automatically send voice messages", // Auto-transcribe voice setting label
        alwaysReadOutLoudExplanation: "Automatically read responses from Meit Ai aloud without needing to tap the button.", // Always read explanation
        autoTranscribeVoiceExplanation: "When you send a voice note, it is automatically transcribed and sent to Meit Ai for a response, without appearing in the typing area." // Auto-transcribe explanation
    },
    fr: { // French text (following the same pattern as English)
        questionPlaceholder: "Exemple: Parlez-moi de...",
        thinkingText: "Le système réfléchit...",
        errorText: "Erreur interne, merci de réessayer.",
        welcomeText: `Bonjour ! Je suis Meit Ai, votre assistante virtuelle de Mei Tai Cacao Lodge.🌿✨
<small-break>Posez-moi une question spécifique (écrite, ou via le microphone) ou demandez à propos de l'un des thèmes ci-dessous: <small-break>
<p>**• À propos de nous et Mei Tai  ℹ️**
**• Important à savoir ⚠️**
**• Check-in / Check-out 🕒**
**• La Cafétéria 'My Time' ☕**
**• Notre chocolat 🍫**
**• App pour dîner 🍖**
**• Piscine 🏊‍♂️**
**• Internet 🌐**
**• Paiement 💳**
**• Faune & Flore 🌿**
**• Activités dans Mei Tai 🥾**
**• Activités hors de Mei Tai 🏞️**
**• Restaurants aux alentours 🍴**<small-break>
<small><p><em>Les informations fournies par ce chatbot sont à titre indicatif et ne constituent pas un engagement contractuel.<em>`,
        disclaimerText: "Meit Ai peut faire des erreurs. Vérifiez les informations importantes.",
        operaWarning: "⚠️ Ce navigateur (Opera) ne prend pas en charge la reconnaissance vocale. Pour une expérience complète, veuillez utiliser Chrome, Edge ou Safari.",
        settings: "Paramètres",
        general: "Général",
        alwaysReadOutLoud: "Toujours lire à haute voix",
        autoTranscribeVoice: "Envoyer automatiquement les messages vocaux",
        alwaysReadOutLoudExplanation: "Les réponses de Meit Ai sont automatiquement lues à voix haute sans avoir besoin d'appuyer sur le bouton.",
        autoTranscribeVoiceExplanation: "Lorsque vous envoyez une note vocale, elle est automatiquement transcrite et envoyée à Meit Ai pour une réponse, sans apparaître dans la zone de saisie."
    },
    es: { // Spanish text (following the same pattern as English)
        questionPlaceholder: "Ejemplo: Háblame de...",
        thinkingText: "El sistema está pensando...",
        errorText: "Error interno, por favor intente de nuevo.",
        welcomeText: `¡Hola! Soy Meit Ai, su asistente virtual de Mei Tai Cacao Lodge.🌿✨ 
<small-break>Hazme una pregunta específica (escrita o mediante el micrófono) o sobre uno de los siguientes temas: <small-break>
<p>**• Sobre nosotros y Mei Tai ℹ️**
**• Importante a Saber ⚠️**
**• Check-in / Check-out 🕒**
**• La Caféteria 'My Time' ☕**
**• Nuestro chocolate 🍫**
**• App para comer la cena 🍖**
**• Piscina 🏊‍♂️**
**• Internet 🌐**
**• Pago 💳**
**• Fauna y Flora 🌿**
**• Actividades dentro de Mei Tai 🥾**
**• Actividades fuera de Mei Tai 🏞️**
**• Restaurantes cercanos 🍴** <small-break>
<small><p><em>La información proporcionada por este chatbot es solo informativa y no constituye un compromiso contractual.<em>`,
        disclaimerText: "Meit Ai puede cometer errores. Verifique la información importante.",
        operaWarning: "⚠️ Este navegador (Opera) no es compatible con el reconocimiento de voz. Para una experiencia completa, utilice Chrome, Edge o Safari.",
        settings: "Configuración",
        general: "General",
        alwaysReadOutLoud: "Leer siempre en voz alta",
        autoTranscribeVoice: "Enviar automáticamente los mensajes de voz",
        alwaysReadOutLoudExplanation: "Las respuestas de Meit Ai se leen automáticamente en voz alta sin necesidad de tocar el botón.",
        autoTranscribeVoiceExplanation: "Cuando envía una nota de voz, se transcribe automáticamente y se envía a Meit Ai para obtener una respuesta, sin aparecer en el área de escritura."
    }
};

// This function updates all the text in the interface when the language changes
export function updateUIText() {
    // Update the placeholder text in the input box
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.placeholder = texts[currentLanguage].questionPlaceholder;
    }

    // Update the disclaimer text at the bottom of the page
    const disclaimerElement = document.getElementById('disclaimer');
    if (disclaimerElement) {
        disclaimerElement.textContent = texts[currentLanguage].disclaimerText;
    }

    // Update any browser warning messages
    const browserWarning = document.querySelector('.browser-warning span');
    if (browserWarning) {
        browserWarning.textContent = texts[currentLanguage].operaWarning;
    }

    // Update the settings modal title
    const settingsTitle = document.getElementById('settingsTitle');
    if (settingsTitle) {
        settingsTitle.textContent = texts[currentLanguage].settings;
    }

    // Update the settings section title
    const settingsSection = document.getElementById('settingsSection');
    if (settingsSection) {
        settingsSection.textContent = texts[currentLanguage].general;
    }
}

// AudioManager is imported in other files to avoid circular dependencies