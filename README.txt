README.TXT - Finca Mei Tai Multilingual Chatbot Project

--------------------------------------------------
CONTENTS
--------------------------------------------------
1.  INTRODUCTION - WHAT IS THIS PROJECT?
2.  MAIN GOAL
3.  HOW IT WORKS (HIGH-LEVEL OVERVIEW)
4.  KEY FEATURES
5.  TECHNOLOGY USED
    5.1 Backend (Server-Side)
    5.2 Frontend (User-Side / Browser)
    5.3 External Services
6.  HOW THE CODE IS ORGANIZED (PROJECT STRUCTURE)
7.  DETAILED COMPONENT BREAKDOWN
    7.1 Backend Components
    7.2 Frontend Components
    7.3 Audio System Details
    7.4 Styling (CSS) Details
8.  SECURITY ASPECTS
9.  PERFORMANCE ASPECTS
10. DEVELOPMENT PRACTICES
11. CONCLUSION

--------------------------------------------------
1. INTRODUCTION - WHAT IS THIS PROJECT?
--------------------------------------------------

This document explains the Finca Mei Tai Chatbot project. It's designed for someone who has no prior knowledge of this specific application.

The project is a web-based chatbot application created for Finca Mei Tai. Think of it as a virtual assistant accessible through a website. What makes it special is that it can understand and communicate in multiple languages (French, English, Spanish) and can also interact using voice – you can speak to it, and it can speak back.

It's built using modern web technologies, with a clear separation between the part that runs on a server (the backend) and the part that runs in the user's web browser (the frontend).

--------------------------------------------------
2. MAIN GOAL
--------------------------------------------------

The primary goal of this project is to provide users visiting the Finca Mei Tai website with an interactive, helpful, and accessible way to get information. It aims to:

*   Answer user questions about Finca Mei Tai.
*   Do this in the user's preferred language (French, English, or Spanish).
*   Offer both text-based chat and voice interaction (speech-to-text and text-to-speech).
*   Be performant, and easy to use.

--------------------------------------------------
3. HOW IT WORKS (HIGH-LEVEL OVERVIEW)
--------------------------------------------------

From a user's perspective, the process is straightforward:

1.  The user visits the web page containing the chatbot.
2.  The user can type a question into the chat input box or click a button to record their voice.
3.  If typing, the user presses 'Send'. If speaking, the recording stops, and the audio is sent.
4.  The user's input (text or audio) is sent securely to the backend server.
5.  If audio was sent, the backend converts it into text.
6.  The backend figures out the user's language and uses the question (now in text form) along with hotel information and chat history to ask an advanced AI (like OpenAI's GPT) for the best answer.
7.  The AI provides an answer in text form.
8.  The backend receives the AI's text answer.
9.  The backend sends this text answer back to the user's browser.
10. The user's browser displays the answer in the chat window.
11. Optionally, if the user has enabled it, the backend also converts the text answer into spoken audio, which is then played back through the user's speakers.

This cycle repeats for each question the user asks.

--------------------------------------------------
4. KEY FEATURES
--------------------------------------------------

*   Multilingual Support: The chatbot fully supports French (fr), English (en), and Spanish (es). It can detect the user's language, use appropriate prompts, and respond in the correct language. Users can also switch languages manually.
*   Voice Interaction:
    *   Speech-to-Text: Users can speak their questions, and the system converts the audio into text using services like OpenAI's Whisper API.
    *   Text-to-Speech: The chatbot's text responses can be converted into natural-sounding speech using services like OpenAI's TTS API or Google Cloud Text-to-Speech.
*   AI-Powered Chat: Uses OpenAI's powerful language models (like GPT-4) to understand questions and generate relevant, context-aware answers based on Finca Mei Tai's information.
*   Secure Communication: All communication between the user's browser and the server uses HTTPS encryption, protecting user data. Secure session management is also implemented.
*   Performance Optimized: The application is designed to load quickly and run smoothly. This includes techniques like preloading important files and optimizing how resources are handled.
*   Responsive Design: The interface adapts to different screen sizes, working well on both desktop computers and mobile devices.
*   User Settings: Users can customize certain aspects, like whether the bot should automatically read responses aloud.

--------------------------------------------------
5. TECHNOLOGY USED
--------------------------------------------------

The project uses a combination of technologies for different parts of the application:

5.1 Backend (Server-Side)

This is the "brain" of the operation, running on a server, not visible to the end-user.

*   Runtime Environment: Node.js (Allows running JavaScript code on the server).
*   Web Framework: Express.js (A popular framework for Node.js that makes building web servers and APIs easier).
*   Security: HTTPS/SSL (Encrypts communication). Uses `express-session` for managing user sessions securely (keeping track of chat history, language preference).
*   Key Libraries:
    *   `openai`: To communicate with OpenAI's APIs (GPT for chat, Whisper for speech-to-text, TTS for text-to-speech).
    *   `dotenv`: To manage configuration settings securely (like API keys).
    *   `multer`: To handle file uploads (specifically, the audio recordings from the user).
    *   `winston`: For logging server activity and errors.

5.2 Frontend (User-Side / Browser)

This is what the user sees and interacts with in their web browser.

*   Language: JavaScript (Modern ES6+ version). Code is organized into modules for better structure.
*   User Interface (UI): A custom-built interface (not using frameworks like React or Angular). It includes the chat window, input buttons, settings panels, etc.
*   Audio Recording: `RecordRTC` library is used to handle recording audio directly in the browser, chosen for its good compatibility across different browsers, especially on Android. Also uses Web Speech API for PC and iOS.
*   Structure: Standard HTML (`index.html`) for the page structure, CSS (`style/` directory) for visual appearance, and JavaScript (`js/` directory) for interactivity.
*   Assets: Images, icons stored in `assets/`.

5.3 External Services

These are third-party services the backend communicates with to provide core functionality.

*   OpenAI API: Provides the AI for chat (GPT models), speech-to-text (Whisper), and text-to-speech (TTS).

--------------------------------------------------
6. HOW THE CODE IS ORGANIZED (PROJECT STRUCTURE)
--------------------------------------------------

The project files are organized into several main folders:

*   `src/`: Contains all the backend (server-side) code written in Node.js.
    *   `server.js`: The main file that starts the web server.
    *   `routes/`: Defines the specific web addresses (API endpoints) the frontend can talk to.
        *   `apiRoutes.js`: Contains the logic for handling requests related to chat, speech-to-text, text-to-speech, and hotel info.
    *   `hotel-info.json`: A file storing the information about Finca Mei Tai that the chatbot uses to answer questions. It likely contains data in French, English, and Spanish.

*   `public/`: Contains all the frontend files that are sent directly to the user's browser.
    *   `index.html`: The main HTML file defining the structure of the web page.
    *   `style/`: Contains CSS files that define the visual appearance (colors, layout, fonts).
    *   `js/`: Contains all the JavaScript files that run in the user's browser to make the page interactive. These are broken down into modules for specific tasks (like audio handling, chat interface, language selection, etc.).
    *   `assets/`: Contains static files like images and icons used in the interface.

*   `certificates/`: Stores the SSL certificate files needed to run the server securely over HTTPS.

*   `node_modules/`: This folder is automatically generated when setting up the project. It contains all the external libraries (dependencies) the backend needs to run.

*   `package.json`: A configuration file for the Node.js project. It lists the project's dependencies and other metadata.

*   `.env`: A crucial file (usually kept private) that stores sensitive configuration details like API keys and server port numbers.

--------------------------------------------------
7. DETAILED COMPONENT BREAKDOWN
--------------------------------------------------

Let's look closer at the key parts:

7.1 Backend Components (`src/`)

*   `server.js`:
    *   Sets up and starts the web server using Express.js.
    *   Configures it to use HTTPS for security, using certificates from the `certificates/` folder. It likely redirects any non-secure HTTP traffic to HTTPS.
    *   Configures secure session management (`express-session`) to keep track of user-specific data like chat history and language preference between requests. Cookies used for sessions are configured securely (HTTP-only, SameSite).
    *   Serves the static frontend files (HTML, CSS, JS, images) from the `public/` directory to the user's browser.
    *   Loads configuration from the `.env` file.
    *   Connects the API routes defined in `apiRoutes.js` so the server knows how to respond to API requests.
    *   Includes basic security middleware (e.g., potentially for CSRF protection).
    *   Handles initialization errors gracefully (e.g., if an API key is missing).

*   `apiRoutes.js`:
    *   This file defines the specific actions the server can perform when the frontend sends requests to certain URLs (like `/api/chat`).
    *   Hotel Information Handling: It loads and processes the `hotel-info.json` file, making the hotel's information available in all supported languages for the AI to use. It cleans up the data (e.g., removing section numbers).
    *   Chat Endpoint (`/api/chat`):
        *   Receives the user's message (text) and chat history from the frontend.
        *   Detects the language or uses the one stored in the session.
        *   Constructs a detailed prompt for the OpenAI GPT model, including instructions about the chatbot's persona, language, available hotel info, and the conversation history.
        *   Sends the prompt to the OpenAI API.
        *   Receives the text response from OpenAI.
        *   Stores the new message pair in the user's session history.
        *   Sends the AI's text response back to the frontend.
    *   Speech-to-Text Endpoint (`/api/speech-to-text`):
        *   Receives an audio file uploaded from the frontend (using `multer`).
        *   Sends this audio file to the OpenAI Whisper API for transcription.
        *   Specifies the language if known, or lets Whisper detect it.
        *   Receives the transcribed text from Whisper.
        *   Sends this text back to the frontend (which then likely sends it to the `/api/chat` endpoint).
    *   Text-to-Speech Endpoint (`/api/text-to-speech`):
        *   Receives text (usually the AI's response) and a language identifier from the frontend.
        *   Uses either OpenAI's TTS API or Google Cloud TTS API to convert this text into audio data (e.g., an MP3 file).
        *   Handles potentially long text by splitting it into smaller chunks (around 4000 characters or by sentences) before sending to the TTS API, then combines the audio if necessary.
        *   Streams the generated audio data back to the frontend so it can start playing quickly.

7.2 Frontend Components (`public/`)

*   `index.html`:
    *   The skeleton of the webpage. Uses modern HTML5 tags for structure and semantics.
    *   Includes meta tags for mobile responsiveness and basic SEO.
    *   Uses ARIA attributes extensively to improve accessibility for users with screen readers.
    *   Defines the main areas: header (with language/settings buttons), chat message display area, and the input area (text box, voice record button, send button).
    *   Includes templates for how user messages and bot messages should look.
    *   Contains modal dialogs (pop-up windows) for help and settings, also designed with accessibility in mind.
    *   Optimizes loading by using `preload` hints for critical CSS, JavaScript modules, and images, making the application feel faster.
    *   Loads the main JavaScript file (`application.js`) using the `module` type.

*   JavaScript Modules (`js/`): The frontend logic is broken down into several collaborating modules:
    *   `application.js`: The main entry point. It initializes all other modules, checks for browser compatibility, handles initial setup (like unlocking audio on mobile), and coordinates the overall application flow.
    *   `shared.js`: Contains functions and variables used by multiple other modules. Manages some shared state (like the current language, cached images), formats messages for display, and handles scrolling the chat window.
    *   `chatinterface.js`: Manages the visual chat area. Displays incoming and outgoing messages, handles the auto-resizing text input box, shows/hides the "thinking" indicator, and manages the UI elements related to voice recording (like the waveform).
    *   `audiomanager.js`: The central coordinator for all audio functions. It manages playing the text-to-speech audio received from the backend, handles starting/stopping voice recording initiated by the user, and interacts with the browser's audio capabilities.
    *   `recordingManager.js` (and `recordrtc-loader.js`): Specifically handles the voice recording process using the `RecordRTC` library (especially for Android compatibility). Captures audio, potentially displays a waveform, and prepares the audio data for sending to the backend's speech-to-text endpoint.
    *   `ttsManager.js`: Manages the text-to-speech feature. Takes text responses, sends requests to the backend's text-to-speech endpoint, receives the audio stream, and works with `audiomanager.js` to play it back. Includes logic for auto-reading messages if the user enables it.
    *   `language.js`: Handles language detection (based on browser settings or user selection), allows the user to switch languages, updates the UI text accordingly, and informs the backend about the current language.
    *   `modal.js`: Controls the behavior of the pop-up help and settings windows (opening, closing, animations, touch interactions).
    *   `settings.js`: Manages user preferences (like the auto-read toggle). Saves settings (likely using browser `localStorage`) and updates the UI based on saved preferences.
    *   `apicommunication.js`: Responsible for all communication with the backend API endpoints (`/api/chat`, `/api/speech-to-text`, `/api/text-to-speech`). Sends requests, handles responses, and manages potential errors during communication.
    *   `utility.js`: Provides general helper functions used across the frontend, such as detecting the user's device type (mobile/desktop), browser checks, showing notifications, and managing scroll behavior.

7.3 Audio System Details

The audio system is sophisticated, handling both input (recording) and output (playback).

*   Playback (`ttsManager.js`, `audioPlaybackManager.js`, `audioUnlockUtils.js`):
    *   Handles browser quirks, especially on mobile where audio often can't play until the user interacts with the page (audio unlocking).
    *   Fetches audio streams from the backend's `/api/text-to-speech` endpoint.
    *   Manages playback states (playing, paused, stopped).
    *   Allows controlling playback rate and volume.
    *   Includes caching mechanisms for audio files to avoid re-fetching.
    *   Cleans up audio resources when they are no longer needed.
*   Recording (`recordingManager.js`, `recordrtc-loader.js`):
    *   Uses `RecordRTC` for broad browser compatibility, especially needed for Android.
    *   Starts and stops audio capture from the user's microphone.
    *   Provides visual feedback (like a waveform).
    *   Encodes the audio into a suitable format (likely WAV or MP3) before uploading.
    *   Handles potential errors during recording.
    *   Detects speech and silence potentially.

7.4 Styling (CSS) Details (`style/`)

The visual appearance is managed through CSS files, likely organized for maintainability:

*   `variables.css`: Defines reusable values for colors, fonts, spacing, etc., creating a consistent design system.
*   `reset.css`: Removes default browser styling inconsistencies.
*   `base.css`: Sets basic styles for common HTML elements.
*   Layout Files (e.g., `layout.css`): Define the overall structure and positioning of major page elements.
*   Component Files (e.g., `messages.css`, `voice.css`, `recording.css`): Contain styles specific to individual UI components like chat bubbles, voice input buttons, or the recording interface.
*   Responsive Design: Uses techniques like media queries to adapt the layout and styling for different screen sizes (mobile, tablet, desktop).
*   Performance: Uses efficient CSS properties and techniques like hardware acceleration (`transform`, `opacity`) and possibly `content-visibility` to ensure smooth rendering and scrolling.
*   Accessibility: Includes styles for focus states (for keyboard navigation) and potentially high-contrast modes.

--------------------------------------------------
8. SECURITY ASPECTS
--------------------------------------------------

Security was a key consideration during development:

*   HTTPS Encryption: All data transmitted between the browser and server is encrypted using SSL/TLS certificates. The server enforces HTTPS.
*   Secure Session Management: `express-session` is configured with secure settings:
    *   `httpOnly` cookies: Prevents client-side JavaScript from accessing session cookies.
    *   `secure` cookies: Ensures cookies are only sent over HTTPS.
    *   `sameSite` policy: Helps mitigate Cross-Site Request Forgery (CSRF) attacks.
*   CSRF Protection: Specific middleware might be in place to further prevent CSRF.
*   Environment Variables (`.env`): Sensitive information like API keys and session secrets are stored outside the main codebase in the `.env` file, preventing accidental exposure.
*   Input Validation: Although not explicitly detailed in every analysis, proper API design implies some level of validation on data received from the frontend (e.g., checking file types for uploads).
*   Error Message Sanitization: Care is likely taken not to expose sensitive system details in error messages sent back to the user.

--------------------------------------------------
9. PERFORMANCE ASPECTS
--------------------------------------------------

The application incorporates several techniques to ensure good performance:

*   Resource Preloading (`index.html`): Critical CSS, JavaScript modules, and images are hinted to the browser to load early, speeding up the initial rendering.
*   Modular JavaScript: Breaking the frontend code into modules allows the browser to load only the necessary code and can improve loading performance. Deferred loading might also be used.
*   Optimized Asset Handling: Efficient loading strategies for images and other assets. Image caching is implemented in `shared.js`.
*   Efficient Audio Handling: Streaming audio responses for text-to-speech means playback can start before the entire audio file is downloaded. Caching helps reduce repeated downloads. `RecordRTC` is chosen for efficient recording.
*   CSS Optimizations: Using performant CSS properties and techniques like hardware acceleration helps ensure smooth animations and scrolling.
*   Backend Efficiency: Text chunking for TTS prevents overloading the TTS API and allows for faster response initiation.

--------------------------------------------------
10. DEVELOPMENT PRACTICES
--------------------------------------------------

The project structure and analyses suggest good development practices were followed:

*   Modularity: Both backend and frontend code are broken down into smaller, manageable modules with specific responsibilities (separation of concerns).
*   Clear Structure: A logical folder structure makes it easier to find code.
*   Code Documentation: The analysis mentions well-documented code (though the code itself isn't provided here).
*   Consistency: Use of a design system (`variables.css`) promotes visual consistency.
*   Security Focus: Security features are integrated throughout (HTTPS, secure sessions, environment variables).
*   Performance Focus: Optimization techniques are applied at various levels (frontend loading, backend processing, CSS).
*   Accessibility (A11y): Significant use of ARIA attributes and semantic HTML indicates a focus on making the application usable for people with disabilities.

--------------------------------------------------
11. CONCLUSION
--------------------------------------------------

The Finca Mei Tai Chatbot is a modern, feature-rich web application designed to provide multilingual, voice-enabled assistance to users. It leverages powerful external AI services for its core chat and speech capabilities. The architecture emphasizes security, performance, accessibility, and maintainability through modular design and adherence to best practices in both backend (Node.js/Express) and frontend (JavaScript/HTML/CSS) development.