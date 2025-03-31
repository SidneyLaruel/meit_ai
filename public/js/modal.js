// modal.js - This file handles all the popup windows (modals) in the application
// Bringing in tools and functions from other files that we'll need
import { currentLanguage, setCurrentLanguage, texts } from './shared.js'; // Getting language functions and text

// This line writes a message to the developer console to confirm this file has been loaded
console.log('modal.js module loaded'); // ADDED LOG

// Define tooltip texts for the help button in different languages
export const helpButtonTooltips = {
  en: "How to use", // English tooltip
  fr: "Comment utiliser", // French tooltip
  es: "Cómo usar" // Spanish tooltip
};

// Modal title translations for different languages
export const modalTitles = {
  en: "About Meit Ai", // English title
  fr: "À propos de Meit Ai", // French title
  es: "Acerca de Meit Ai" // Spanish title
};

// Help modal texts for each language
// (Large HTML/CSS content here - not adding individual comments as they're mostly HTML/CSS)
export const helpModalTexts = {
  en: `
  <style>
    .what-is-section, .help-section {
      display: flex;
      flex-direction: row;
      gap: 20px;
      margin-bottom: 30px;
      align-items: flex-start;
    }
    .what-is-text, .help-text {
      flex: 1;
      text-align: justify;
      margin-bottom: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .what-is-text h3, .help-text h3 {
      margin-bottom: 20px;
    }
    .what-is-text p, .help-text p {
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .what-is-image, .help-image {
      width: 220px;
      height: auto;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .help-section {
      margin-bottom: 0;
      margin-top: -5px;
      text-align: justify;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #fff;
    }
    .help-section p {
      margin-bottom: 15px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section ul {
      padding-left: 20px;
      margin-bottom: 5px;
      margin-top: 5px;
    }
    .help-section li {
      margin-bottom: 10px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section li strong {
      display: block;
      margin-bottom: 1px;
    }
    .modal-header {
      margin-bottom: 0;
    }
    .settings-info {
      margin-bottom: 15px;
      margin-top: -5px;
      padding-left: 10px;
    }
    .setting-info-text {
      font-size: 13px;
      color: #8c8c8c;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }
    .section-divider {
      height: 1px;
      background-color: #444;
      margin: 30px 0;
    }
    .move-up-image {
      margin-top: -200px;
    }
    /* Mobile-only class to hide on PC */
    .mobile-only {
      display: none;
    }
    /* PC-only class to hide on mobile */
    .pc-only {
      display: block;
    }
    @media (max-width: 600px) {
      .what-is-section, .help-section {
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }
      .what-is-text, .help-text {
        width: 100%;
      }
      .what-is-image, .help-image {
        width: 200px;
        height: auto;
        margin: 0 auto;
        display: block;
      }
      .move-up-image {
        margin-top: 0; /* Reset the negative margin on mobile */
      }
      .help-section {
        margin-top: 0;
      }
      .modal-header {
        margin-bottom: 0;
      }
      /* Mobile-only class to show on mobile */
      .mobile-only {
        display: block;
      }
      /* PC-only class to hide on mobile */
      .pc-only {
        display: none;
      }
    }
  </style>

  <div class="what-is-section">
    <div class="what-is-text">
      <h3>What is Meit Ai?</h3>
      <p>Meit Ai is an advanced AI-driven assistant designed specifically for Mei Tai Cacao Lodge. It leverages artificial intelligence and a dedicated source of information to provide accurate answers to your questions. Whether you're curious about the cafeteria, activities outside the finca, or want detailed explanations on various topics, Meit Ai is here to help.</p>
    </div>
    <img src="assets/bot.png" alt="Meit Ai Bot" class="what-is-image">
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <img src="assets/bot_desk.png" alt="How to use Meit Ai" class="help-image pc-only">
    <div class="help-text">
      <h3>How to use Meit Ai</h3>
      <p>Meit Ai offers a user-friendly interface with two primary interaction methods: writing and vocal communication. Here's how you can make the most of your experience:</p>
      <p>To use the writing method, first click on the text field at the bottom of the screen labeled "Example: Tell me about...". Next, simply type your question into the field. Once your question is ready, send it by pressing the Enter key to submit, or by pressing the arrow button.</p>
      <img src="assets/bot_desk.png" alt="How to use Meit Ai" class="help-image mobile-only">
      <p>For the voice input method, click the microphone button once (do not hold it down). A visual representation of your voice will appear, along with a close button on the left to cancel and a send button to confirm. Once the microphone is activated, speak your question clearly into your device. When you're done, click the checkmark button. Your transcribed voice note will appear in the text input field, allowing you to review and edit your message before sending it.</p>
      <img src="assets/bot_mic.png" alt="Voice input for Meit Ai" class="help-image mobile-only">
    </div>
  </div>

  <div class="help-section pc-only">
    <img src="assets/bot_mic.png" alt="Voice input for Meit Ai" class="help-image move-up-image">
    <div class="help-text">
      <p>The voice input feature makes interacting with Meit Ai even more convenient, especially when you're in a hurry or prefer speaking over typing. The advanced speech recognition technology ensures accurate transcription of your questions, making communication seamless and natural.</p>
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <div class="help-text">
      <h3>How to communicate with Meit Ai</h3>
      <p>Talk to it as you would to a human. The bot is programmed to recognize context and adapt its responses based on your input. If you have a detailed question, include relevant details to help the bot understand your query better. You can also ask broad questions or specific ones. The bot can remember past questions too. If the initial answer isn't quite what you were looking for, feel free to ask for clarification or further details.</p>
      <img src="assets/bot_book.png" alt="How to communicate with Meit Ai" class="help-image mobile-only">
      <p>Here are some recommended phrasing:</p>
      <ul>
        <li>Tell me about […]</li>
        <li>Explain […] to me</li>
        <li>I don't understand […]</li>
      </ul>
    </div>
    <img src="assets/bot_book.png" alt="How to communicate with Meit Ai" class="help-image pc-only">
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <img src="assets/bot_flying.png" alt="Why Use Meit Ai" class="help-image pc-only">
    <div class="help-text">
      <h3>Why Use Meit Ai?</h3>
      <p>Meit Ai is designed with you in mind, offering several significant advantages that make it an indispensable tool at the lodge:</p>
      <img src="assets/bot_flying_mobile.png" alt="Why Use Meit Ai" class="help-image mobile-only">
      <ul>
        <li><strong>Instant Answers, Anytime:</strong>
        No waiting in line or waiting for someone to respond. Meit Ai is available 24/7, ensuring you have access to information whenever you need it.</li>
        <li><strong>Unrestricted Access:</strong>
        Ask anything at any time, from anywhere within the lodge. Whether you're in your room, or in a common area, Meit Ai is just a question away.</li>
        <li><strong>Broad Knowledge Base:</strong>
        With its extensive database, the bot covers a wide range of topics. If the information exists, Meit Ai will find it and share it with you.</li>
        <li><strong>Enhanced Lodge Experience:</strong>
        By providing immediate, reliable responses, Meit Ai streamlines your day-to-day activities, making your time at the lodge more enjoyable and efficient.</li>
      </ul>
    </div>
  </div>

  <div class="help-section">
    <img src="assets/bot_guide.png" alt="Meit Ai as your guide" class="help-image move-up-image">
    <div class="help-text">
      <p>Think of Meit Ai as your personal digital concierge at Mei Tai Cacao Lodge, always ready to guide you through your stay and enhance your experience with timely, accurate information tailored to your needs.</p>
    </div>
  </div>
  `,

  fr: `
  <style>
    .what-is-section, .help-section {
      display: flex;
      flex-direction: row;
      gap: 20px;
      margin-bottom: 30px;
      align-items: flex-start;
    }
    .what-is-text, .help-text {
      flex: 1;
      text-align: justify;
      margin-bottom: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .what-is-text h3, .help-text h3 {
      margin-bottom: 20px;
    }
    .what-is-text p, .help-text p {
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .what-is-image, .help-image {
      width: 220px;
      height: auto;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .help-section {
      margin-bottom: 0;
      margin-top: -5px;
      text-align: justify;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #fff;
    }
    .help-section p {
      margin-bottom: 15px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section ul {
      padding-left: 20px;
      margin-bottom: 5px;
      margin-top: 5px;
    }
    .help-section li {
      margin-bottom: 10px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section li strong {
      display: block;
      margin-bottom: 1px;
    }
    .modal-header {
      margin-bottom: 0;
    }
    .settings-info {
      margin-bottom: 15px;
      margin-top: -5px;
      padding-left: 10px;
    }
    .setting-info-text {
      font-size: 13px;
      color: #8c8c8c;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }
    .section-divider {
      height: 1px;
      background-color: #444;
      margin: 30px 0;
    }
    .move-up-image {
      margin-top: -200px;
    }
    /* Mobile-only class to hide on PC */
    .mobile-only {
      display: none;
    }
    /* PC-only class to hide on mobile */
    .pc-only {
      display: block;
    }
    @media (max-width: 600px) {
      .what-is-section, .help-section {
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }
      .what-is-text, .help-text {
        width: 100%;
      }
      .what-is-image, .help-image {
        width: 200px;
        height: auto;
        margin: 0 auto;
        display: block;
      }
      .move-up-image {
        margin-top: 0; /* Reset the negative margin on mobile */
      }
      .help-section {
        margin-top: 0;
      }
      .modal-header {
        margin-bottom: 0;
      }
      /* Mobile-only class to show on mobile */
      .mobile-only {
        display: block;
      }
      /* PC-only class to hide on mobile */
      .pc-only {
        display: none;
      }
    }
  </style>

  <div class="what-is-section">
    <div class="what-is-text">
      <h3>Qu'est-ce que Meit Ai ?</h3>
      <p>Meit Ai est un assistant avancé basé sur l'intelligence artificielle, conçu spécifiquement pour Mei Tai Cacao Lodge. Il utilise l'intelligence artificielle et une source d'information dédiée pour fournir des réponses précises à vos questions. Que vous soyez curieux à propos de la cafétéria, des activités à l'extérieur de la finca, ou que vous souhaitiez des explications détaillées sur divers sujets, Meit Ai est là pour vous aider.</p>
    </div>
    <img src="assets/bot.png" alt="Meit Ai Bot" class="what-is-image">
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <img src="assets/bot_desk.png" alt="Comment utiliser Meit Ai" class="help-image pc-only">
    <div class="help-text">
      <h3>Comment utiliser Meit Ai</h3>
      <p>Meit Ai offre une interface conviviale avec deux méthodes d'interaction principales : l'écriture et la communication vocale. Voici comment tirer le meilleur parti de votre expérience :</p>
      <p>Pour utiliser la méthode d'écriture, cliquez d'abord sur le champ de texte en bas de l'écran intitulé "Exemple : Parlez-moi de...". Ensuite, tapez simplement votre question dans le champ. Une fois votre question prête, envoyez-la en appuyant sur la touche Entrée ou en cliquant sur le bouton fléché.</p>
      <img src="assets/bot_desk.png" alt="Comment utiliser Meit Ai" class="help-image mobile-only">
      <p>Pour la méthode vocale, cliquez une fois sur le bouton du microphone (ne le maintenez pas enfoncé). Une représentation visuelle de votre voix apparaîtra, avec un bouton de fermeture à gauche pour annuler et un bouton d'envoi pour confirmer. Une fois le microphone activé, énoncez clairement votre question dans votre appareil. Lorsque vous avez terminé, cliquez sur le bouton de validation. Votre note vocale transcrite apparaîtra dans le champ de saisie de texte, vous permettant de revoir et de modifier votre message avant de l'envoyer.</p>
      <img src="assets/bot_mic.png" alt="Entrée vocale pour Meit Ai" class="help-image mobile-only">
    </div>
  </div>

  <div class="help-section pc-only">
    <img src="assets/bot_mic.png" alt="Entrée vocale pour Meit Ai" class="help-image move-up-image">
    <div class="help-text">
      <p>La fonction d'entrée vocale rend l'interaction avec Meit Ai encore plus pratique, surtout lorsque vous êtes pressé ou préférez parler plutôt que taper. La technologie avancée de reconnaissance vocale assure une transcription précise de vos questions, rendant la communication fluide et naturelle.</p>
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <div class="help-text">
      <h3>Comment communiquer avec Meit Ai</h3>
      <p>Parlez-lui comme vous le feriez à un humain. Le bot est programmé pour reconnaître le contexte et adapter ses réponses en fonction de votre saisie. Si vous avez une question détaillée, incluez des détails pertinents pour aider le bot à mieux comprendre votre requête. Vous pouvez également poser des questions générales ou spécifiques. Le bot peut aussi se souvenir des questions précédentes. Si la réponse initiale ne correspond pas exactement à ce que vous cherchiez, n'hésitez pas à demander des clarifications ou des détails supplémentaires.</p>
      <img src="assets/bot_book.png" alt="Comment communiquer avec Meit Ai" class="help-image mobile-only">
      <p>Voici quelques formulations recommandées :</p>
      <ul>
        <li>Parle-moi de […]</li>
        <li>Explique-moi […]</li>
        <li>Je ne comprends pas […]</li>
      </ul>
    </div>
    <img src="assets/bot_book.png" alt="Comment communiquer avec Meit Ai" class="help-image pc-only">
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <img src="assets/bot_flying.png" alt="Pourquoi utiliser Meit Ai" class="help-image pc-only">
    <div class="help-text">
      <h3>Pourquoi utiliser Meit Ai ?</h3>
      <p>Meit Ai est conçu pour répondre à vos questions de manière rapide et précise, tout en offrant une expérience agréable et personnalisée. Voici quelques raisons pour lesquelles Meit Ai est un outil indispensable pour vous :</p>
      <img src="assets/bot_flying_mobile.png" alt="Pourquoi utiliser Meit Ai" class="help-image mobile-only">
      <ul>
        <li><strong>Réponses instantanées, à tout moment :</strong>
        Vous n'avez plus besoin d'attendre en ligne ou d'attendre que quelqu'un ne réponde. Meit Ai est disponible 24 heures sur 24, les 7 jours de la semaine, vous permettant d'accéder à l'information quand vous en avez besoin.</li>
        <li><strong>Accès sans restrictions :</strong>
        Posez n'importe quelle question à tout moment, de n'importe où dans le lodge. Que vous soyez dans votre chambre ou dans une zone commune, Meit Ai est à portée d'une question.</li>
        <li><strong>Base de connaissances vaste :</strong>
        Grâce à sa base de données vaste, le bot couvre une large gamme de sujets. Si l'information existe, Meit Ai la trouvera et la partagera avec vous.</li>
        <li><strong>Expérience améliorée au lodge :</strong>
        En offrant des réponses immédiates et fiables, Meit Ai simplifie vos activités quotidiennes, rendant votre séjour au lodge plus agréable et efficace.</li>
      </ul>
    </div>
  </div>

  <div class="help-section">
    <img src="assets/bot_guide.png" alt="Meit Ai comme votre guide" class="help-image move-up-image">
    <div class="help-text">
      <p>Considérez Meit Ai comme votre concierge numérique personnel à Mei Tai Cacao Lodge, toujours prêt à vous guider pendant votre séjour et à améliorer votre expérience avec des informations opportunes et précises, adaptées à vos besoins.</p>
    </div>
  </div>
  `,

  es: `
  <style>
    .what-is-section, .help-section {
      display: flex;
      flex-direction: row;
      gap: 20px;
      margin-bottom: 30px;
      align-items: flex-start;
    }
    .what-is-text, .help-text {
      flex: 1;
      text-align: justify;
      margin-bottom: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .what-is-text h3, .help-text h3 {
      margin-bottom: 20px;
    }
    .what-is-text p, .help-text p {
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .what-is-image, .help-image {
      width: 220px;
      height: auto;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .help-section {
      margin-bottom: 0;
      margin-top: -5px;
      text-align: justify;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: #fff;
    }
    .help-section p {
      margin-bottom: 15px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section ul {
      padding-left: 20px;
      margin-bottom: 5px;
      margin-top: 5px;
    }
    .help-section li {
      margin-bottom: 10px;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: none;
    }
    .help-section li strong {
      display: block;
      margin-bottom: 1px;
    }
    .modal-header {
      margin-bottom: 0;
    }
    .settings-info {
      margin-bottom: 15px;
      margin-top: -5px;
      padding-left: 10px;
    }
    .setting-info-text {
      font-size: 13px;
      color: #8c8c8c;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }
    .section-divider {
      height: 1px;
      background-color: #444;
      margin: 30px 0;
    }
    .move-up-image {
      margin-top: -200px;
    }
    /* Mobile-only class to hide on PC */
    .mobile-only {
      display: none;
    }
    /* PC-only class to hide on mobile */
    .pc-only {
      display: block;
    }
    @media (max-width: 600px) {
      .what-is-section, .help-section {
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }
      .what-is-text, .help-text {
        width: 100%;
      }
      .what-is-image, .help-image {
        width: 200px;
        height: auto;
        margin: 0 auto;
        display: block;
      }
      .move-up-image {
        margin-top: 0; /* Reset the negative margin on mobile */
      }
      .help-section {
        margin-top: 0;
      }
      .modal-header {
        margin-bottom: 0;
      }
      /* Mobile-only class to show on mobile */
      .mobile-only {
        display: block;
      }
      /* PC-only class to hide on mobile */
      .pc-only {
        display: none;
      }
    }
  </style>

  <div class="what-is-section">
    <div class="what-is-text">
      <h3>¿Qué es Meit Ai?</h3>
      <p>Meit Ai es un asistente avanzado basado en inteligencia artificial, diseñado específicamente para Mei Tai Cacao Lodge. Utiliza la inteligencia artificial y una fuente de información dedicada para proporcionar respuestas precisas a sus preguntas. Ya sea que esté interesado en la cafetería, actividades fuera de la finca, o desee explicaciones detalladas sobre varios temas, Meit Ai está aquí para ayudarle.</p>
    </div>
    <img src="assets/bot.png" alt="Meit Ai Bot" class="what-is-image">
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <img src="assets/bot_desk.png" alt="¿Cómo usar Meit Ai?" class="help-image pc-only">
    <div class="help-text">
      <h3>¿Cómo usar Meit Ai?</h3>
      <p>Meit Ai ofrece una interfaz fácil de usar con dos métodos principales de interacción: escritura y comunicación vocal. Aquí está cómo puede aprovechar al máximo su experiencia:</p>
      <p>Para usar el método de escritura, primero haga clic en el campo de texto en la parte inferior de la pantalla etiquetado como "Ejemplo: Háblame de...". Luego, simplemente escriba su pregunta en el campo. Una vez que su pregunta esté lista, envíela presionando la tecla Enter o haciendo clic en el botón de flecha.</p>
      <img src="assets/bot_desk.png" alt="¿Cómo usar Meit Ai?" class="help-image mobile-only">
      <p>Para el método de voz, haga clic una vez en el botón del micrófono (no lo mantenga presionado). Aparecerá una representación visual de su voz, junto con un botón de cierre a la izquierda para cancelar y un botón de envío para confirmar. Una vez que el micrófono esté activado, hable claramente su pregunta en su dispositivo. Cuando haya terminado, haga clic en el botón de verificación. Su nota de voz transcrita aparecerá en el campo de entrada de texto, permitiéndole revisar y editar su mensaje antes de enviarlo.</p>
      <img src="assets/bot_mic.png" alt="Entrada de voz para Meit Ai" class="help-image mobile-only">
    </div>
  </div>

  <div class="help-section pc-only">
    <img src="assets/bot_mic.png" alt="Entrada de voz para Meit Ai" class="help-image move-up-image">
    <div class="help-text">
      <p>La función de entrada de voz hace que la interacción con Meit Ai sea aún más conveniente, especialmente cuando tiene prisa o prefiere hablar en lugar de escribir. La avanzada tecnología de reconocimiento de voz garantiza una transcripción precisa de sus preguntas, haciendo que la comunicación sea fluida y natural.</p>
    </div>
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <div class="help-text">
      <h3>¿Cómo comunicarse con Meit Ai?</h3>
      <p>Hable con él como lo haría con un humano. El bot está programado para reconocer el contexto y adaptar sus respuestas según su entrada. Si tiene una pregunta detallada, incluya detalles relevantes para ayudar al bot a entender mejor su consulta. También puede hacer preguntas generales o específicas. El bot puede recordar preguntas anteriores también. Si la respuesta inicial no es exactamente lo que estaba buscando, no dude en pedir aclaraciones o detalles adicionales.</p>
      <img src="assets/bot_book.png" alt="¿Cómo comunicarse con Meit Ai?" class="help-image mobile-only">
      <p>Aquí hay algunas formulaciones recomendadas:</p>
      <ul>
        <li>Háblame de […]</li>
        <li>Explícame […]</li>
        <li>No entiendo […]</li>
      </ul>
    </div>
    <img src="assets/bot_book.png" alt="¿Por qué usar Meit Ai?" class="help-image pc-only">
  </div>

  <div class="section-divider"></div>

  <div class="help-section">
    <img src="assets/bot_flying.png" alt="¿Por qué usar Meit Ai?" class="help-image pc-only">
    <div class="help-text">
      <h3>¿Por qué usar Meit Ai?</h3>
      <p>Meit Ai está diseñado pensando en usted, ofreciendo varias ventajas significativas que lo convierten en una herramienta indispensable en el lodge:</p>
      <img src="assets/bot_flying_mobile.png" alt="¿Por qué usar Meit Ai?" class="help-image mobile-only">
      <ul>
        <li><strong>Respuestas instantáneas, en cualquier momento:</strong>
        No hay que esperar en línea o esperar a que alguien responda. Meit Ai está disponible las 24 horas, los 7 días de la semana, permitiéndole acceder a la información cuando la necesite.</li>
        <li><strong>Acceso sin restricciones:</strong>
        Haga cualquier pregunta en cualquier momento, desde cualquier lugar dentro del lodge. Ya sea que esté en su habitación o en un área común, Meit Ai está a una pregunta de distancia.</li>
        <li><strong>Amplia base de conocimientos:</strong>
        Con su extensa base de datos, el bot cubre una amplia gama de temas. Si la información existe, Meit Ai la encontrará y la compartirá con usted.</li>
        <li><strong>Experiencia mejorada en el lodge:</strong>
        Al proporcionar respuestas inmediatas y confiables, Meit Ai simplifica sus actividades diarias, haciendo su tiempo en el lodge más agradable y eficiente.</li>
      </ul>
    </div>
  </div>

  <div class="help-section">
    <img src="assets/bot_guide.png" alt="Meit Ai como su guía" class="help-image move-up-image">
    <div class="help-text">
      <p>Piense en Meit Ai como su conserje digital personal en Mei Tai Cacao Lodge, siempre listo para guiarlo durante su estancia y mejorar su experiencia con información oportuna y precisa, adaptada a sus necesidades.</p>
    </div>
  </div>
  `
};

// This function sets up all the modals (popup windows) when the app starts
export function initModals() {
  // This line writes a message to the developer console that we're initializing the modals
  console.log('modal.js initModals() called'); // ADDED LOG
  
  // Create a style element to add the CSS from the help modal
  const style = document.createElement('style');
  // Extract the CSS from the English help modal content
  style.textContent = helpModalTexts.en.match(/<style>(.*?)<\/style>/s)[1]; // Using English as the default
  // Add the style element to the document head
  document.head.appendChild(style);

  // Find all the elements we need for the help modal
  const helpModal = document.getElementById('helpModal'); // The help modal container
  const helpButton = document.getElementById('helpButton'); // The button that opens the help modal
  const closeModal = document.querySelector('#helpModal .close'); // The button that closes the help modal
  const helpTextDiv = document.getElementById('helpText'); // The div that will contain the help text
  const modalBody = document.querySelector('#helpModal .modal-body'); // The body of the help modal
  const modalHeader = document.querySelector('#helpModal .modal-header'); // The header of the help modal
  const modalContent = document.querySelector('#helpModal .modal-content'); // The content of the help modal

  // Find all the elements we need for the settings modal
  const settingsModal = document.getElementById('settingsModal'); // The settings modal container
  const settingsBtn = document.getElementById('settingsButton'); // The button that opens the settings modal
  const closeSettings = document.querySelector('#settingsModal .close'); // The button that closes the settings modal
  const settingsModalContent = document.querySelector('#settingsModal .modal-content'); // The content of the settings modal
  const settingsModalHeader = document.querySelector('#settingsModal .modal-header'); // The header of the settings modal

  // Variables for tracking touch/drag events on mobile
  let touchStartY = 0; // Where the touch started
  let currentTranslateY = 0; // How far the modal has been dragged
  let isDraggingHeader = false; // Whether the user is currently dragging the modal

  // Set up touch event listeners for the help modal on mobile devices
  // These let users drag the modal to close it
  modalHeader.addEventListener('touchstart', (e) => {
    // When the user touches the modal header
    handleTouchStart(e, modalContent, modalHeader);
  });
  modalHeader.addEventListener('touchmove', (e) => {
    // When the user moves their finger while touching the modal header
    handleTouchMove(e, modalContent, modalHeader);
  });
  modalHeader.addEventListener('touchend', () => {
    // When the user lifts their finger from the modal header
    handleTouchEnd(modalContent, helpModal);
  });
  modalHeader.addEventListener('touchcancel', () => {
    // If the touch is cancelled (like if another app interrupts)
    handleTouchCancel(modalContent);
  });

  // Set up similar touch event listeners for the settings modal
  settingsModalHeader.addEventListener('touchstart', (e) => {
    handleTouchStart(e, settingsModalContent, settingsModalHeader);
  });
  settingsModalHeader.addEventListener('touchmove', (e) => {
    handleTouchMove(e, settingsModalContent, settingsModalHeader);
  });
  settingsModalHeader.addEventListener('touchend', () => {
    handleTouchEnd(settingsModalContent, settingsModal);
  });
  settingsModalHeader.addEventListener('touchcancel', () => {
    handleTouchCancel(settingsModalContent);
  });

  // When the help button is clicked, open the help modal
  helpButton.addEventListener('click', () => {
    // Set the help text to the appropriate language
    helpTextDiv.innerHTML = helpModalTexts[currentLanguage];
    // Set the modal title to the appropriate language
    document.getElementById('modalTitle').textContent = modalTitles[currentLanguage];
    // Open the modal
    handleModal('open', helpModal, modalContent);
    // Scroll to the top of the modal
    modalBody.scrollTop = 0;
  });

  // When the close button on the help modal is clicked, close the modal
  closeModal.addEventListener('click', () => {
    handleModal('close', helpModal, modalContent);
  });

  // When the user clicks outside the help modal, close it
  window.addEventListener('click', (event) => {
    if (event.target == helpModal) {
      handleModal('close', helpModal, modalContent);
    }
  });

  // When the user presses the Escape key, close any open modal
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      // If the help modal is open, close it
      if (helpModal.style.display === "block") {
        handleModal('close', helpModal, modalContent);
      } 
      // If the settings modal is open, close it
      else if (settingsModal.style.display === "block") {
        closeSettingsModal(settingsModal, settingsModalContent);
      }
    }
  });

  // When the settings button is clicked, open the settings modal
  settingsBtn.addEventListener('click', () => {
    // Show the settings modal
    settingsModal.style.display = 'block';
    // Add the 'show' class to trigger the fade-in animation
    settingsModal.classList.add('show');
    // If on mobile, animate the modal sliding up from the bottom
    if (window.innerWidth <= 600) {
      // First set it at the starting position (off-screen)
      settingsModalContent.style.transform = 'translateY(0)';
      // Then on the next animation frame, slide it up
      requestAnimationFrame(() => {
        settingsModalContent.style.transform = 'translateY(-80vh)';
      });
    }
  });

  // When the close button on the settings modal is clicked, close the modal
  closeSettings.addEventListener('click', () => {
    closeSettingsModal(settingsModal, settingsModalContent);
  });

  // When the user clicks outside the settings modal, close it
  document.addEventListener('mousedown', function(event) {
    if (settingsModal.style.display === 'block' &&
        !settingsModalContent.contains(event.target) &&
        event.target !== settingsBtn) {
      closeSettingsModal(settingsModal, settingsModalContent);
    }
  });

  // Special handling for mobile devices to allow dragging the settings modal to close it
  if ('ontouchstart' in window) { // Check if touch is supported
    // Variables to track the touch
    let startY = 0; // Where the touch started
    let currentY = 0; // Current touch position
    let isDragging = false; // Whether the user is dragging
    const modalHeight = window.innerHeight * 0.8; // Height of the modal (80% of viewport height)

    // When the user touches the settings modal header
    settingsModalHeader.addEventListener('touchstart', function(e) {
      // If the modal isn't visible, do nothing
      if (settingsModal.style.display !== 'block') return;

      // Save the starting touch position
      startY = e.touches[0].clientY;
      // Start dragging
      isDragging = true;
      // Remove transition animations during dragging for smoothness
      settingsModalContent.style.transition = 'none';
    });

    // When the user moves their finger while touching
    document.addEventListener('touchmove', function(e) {
      // If not dragging, do nothing
      if (!isDragging) return;

      // Get the current touch position
      currentY = e.touches[0].clientY;
      // Calculate how far it's been dragged
      const dragDistance = currentY - startY;

      // Only allow dragging downward (to close)
      if (dragDistance > 0) {
        // Move the modal down by the drag distance
        settingsModalContent.style.transform = `translateY(calc(-80vh + ${dragDistance}px))`;
      }
    });

    // When the user lifts their finger
    document.addEventListener('touchend', function() {
      // If not dragging, do nothing
      if (!isDragging) return;

      // Calculate how far it's been dragged
      const dragDistance = currentY - startY;
      // Define a threshold for closing (50% of modal height)
      const threshold = modalHeight * 0.5;

      // Re-enable transition animations for the snap effect
      settingsModalContent.style.transition = 'transform 0.3s ease-out';

      // If dragged past the threshold, close the modal
      if (dragDistance > threshold) {
        closeSettingsModal(settingsModal, settingsModalContent);
      } else {
        // Otherwise, snap it back to the open position
        settingsModalContent.style.transform = 'translateY(-80vh)';
      }

      // End the dragging state
      isDragging = false;
    });

    // If the touch is cancelled
    document.addEventListener('touchcancel', function() {
      if (isDragging) {
        // Re-enable transition animations
        settingsModalContent.style.transition = 'transform 0.3s ease-out';
        // Snap back to the open position
        settingsModalContent.style.transform = 'translateY(-80vh)';
        // End the dragging state
        isDragging = false;
      }
    });

    // When the user touches outside the settings modal
    document.addEventListener('touchstart', function(event) {
      if (settingsModal.style.display === 'block' &&
          !settingsModalContent.contains(event.target) &&
          event.target !== settingsBtn) {
        // Close the modal
        closeSettingsModal(settingsModal, settingsModalContent);
      }
    });
  }

  // This function closes the settings modal
  function closeSettingsModal(settingsModal, settingsModalContent) {
    handleModal('close', settingsModal, settingsModalContent);
  }

  // This function handles the start of a touch on a modal header
  function handleTouchStart(e, modalContent, modalHeader) {
    // Record the starting touch position
    touchStartY = e.touches[0].clientY;
    // Set the initial vertical position
    currentTranslateY = -80; // Starting position in vh units (80% from the top)
    // Start dragging
    isDraggingHeader = true;
    // Remove transition animations during dragging for smoothness
    modalContent.style.transition = 'none';
  }

  // This function handles the user moving their finger while touching the modal header
  function handleTouchMove(e, modalContent, modalHeader) {
    // If not dragging, do nothing
    if (!isDraggingHeader) return;

    // Prevent scrolling while dragging
    e.preventDefault();
    // Get the current touch position
    const currentY = e.touches[0].clientY;
    // Calculate how far it's been dragged
    const deltaY = currentY - touchStartY;

    // Only allow dragging down (to close), not up
    if (deltaY >= 0) {
      // Calculate new position as a percentage of viewport height
      const translateY = Math.min(0, -80 + (deltaY / window.innerHeight) * 100);
      // Move the modal to the new position
      modalContent.style.transform = `translateY(${translateY}vh)`;
    } else {
      // If trying to drag upward, keep at the fully open position
      modalContent.style.transform = 'translateY(-80vh)';
    }
  }

  // This function handles the end of a touch on a modal header
  function handleTouchEnd(modalContent, modal) {
    // Re-enable transition animations for the snap effect
    modalContent.style.transition = 'transform 0.1s ease-out';
    // Get the current position of the modal
    const currentTranslate = parseFloat(getComputedStyle(modalContent).transform.split(',')[5]) || 0;
    // Convert to a percentage of viewport height
    const translatePercent = (currentTranslate / window.innerHeight) * 100;

    // If the modal is dragged down past halfway, close it
    if (translatePercent > -40) {
      handleModal('close', modal, modalContent);
    } else {
      // Otherwise, snap back to the fully open position
      modalContent.style.transform = 'translateY(-80vh)';
    }
    // End the dragging state
    isDraggingHeader = false;
  }

  // This function handles a cancelled touch on a modal header
  function handleTouchCancel(modalContent) {
    // Re-enable transition animations
    modalContent.style.transition = 'transform 0.1s ease-out';
    // Snap back to the fully open position
    modalContent.style.transform = 'translateY(-80vh)';
    // End the dragging state
    isDraggingHeader = false;
  }
}

// This function handles opening and closing modals
export function handleModal(action, modal, modalContent) {
  if (action === 'open') {
    // Show the modal
    modal.style.display = 'block';
    // Force a reflow before adding the show class (to ensure the animation works)
    modal.offsetHeight;
    // Add the 'show' class to trigger the fade-in animation
    modal.classList.add('show');
    // If on mobile, animate the modal sliding up from the bottom
    if (window.innerWidth <= 600) {
      // First set it at the starting position (off-screen)
      modalContent.style.transform = 'translateY(0)';
      // Then on the next animation frame, slide it up
      requestAnimationFrame(() => {
        modalContent.style.transform = 'translateY(-80vh)';
      });
    }
  } else {
    // Remove the 'show' class to trigger the fade-out animation
    modal.classList.remove('show');
    // If on mobile, slide the modal back down
    if (window.innerWidth <= 600) {
      modalContent.style.transform = 'translateY(0)';
    }
    // After the animation completes, hide the modal completely
    setTimeout(() => {
      modal.style.display = 'none';
    }, 50); // Reduced from 100ms to 50ms
  }
}

// This function updates the text in modals when the language changes
export function updateModalText() {
  // Update the help modal text if it's open
  const helpTextDiv = document.getElementById('helpText');
  if (helpTextDiv) {
    helpTextDiv.innerHTML = helpModalTexts[currentLanguage] || '';
  }
  
  // Update the modal title
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) {
    modalTitle.textContent = modalTitles[currentLanguage] || '';
  }
  
  // Update the help button tooltip
  const helpButton = document.getElementById('helpButton');
  if (helpButton) {
    helpButton.title = helpButtonTooltips[currentLanguage] || '';
  }
}

// This function is called when the language changes
export function onLanguageChange() {
  // Update all the text in the modals to the new language
  updateModalText();
}