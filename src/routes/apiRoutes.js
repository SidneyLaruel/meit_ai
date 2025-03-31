// routes/apiRoutes.js
import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load hotel information function
let hotelInfo = { fr: '', en: '', es: '' };

async function loadHotelInfo() {
  try {
    // Load structured data
    const hotelData = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'hotel-info.json'), 'utf-8'));
    
    // For each language, combine all information into a single text
    for (const lang of Object.keys(hotelInfo)) {
      const sections = [];
      
      // Iterate through all topics in the data
      for (const [topic, translations] of Object.entries(hotelData)) {
        if (translations[lang] && translations[lang].trim() !== '') {
          // Extract the actual content without the section number
          let content = translations[lang];
          
          // Remove the section number from the first line if it exists
          content = content.replace(/^\d+(\.[A-Z])?\.?\s+[A-ZÉÈÊËÀÁÂÄÃÅÇÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ].*?\n/, '');
          
          // Format the topic name to be more readable
          const formattedTopic = topic.replace(/_/g, ' ').toUpperCase();
          sections.push(`${formattedTopic}:\n${content}`);
        }
      }
      
      // Join all sections with double newlines
      hotelInfo[lang] = sections.join('\n\n');
    }
    
    console.log('Multilingual hotel information loaded successfully.');
    return hotelInfo;
  } catch (err) {
    console.error('Error loading hotel information:', err);
    throw err;
  }
}

// Initial hotel info loading
const initializeHotelInfo = async () => {
  try {
    hotelInfo = await loadHotelInfo();
    return hotelInfo;
  } catch (err) {
    console.error('Failed to load hotel information:', err);
    throw err;
  }
};

// Attach the initialization function to the router object
router.initializeHotelInfo = initializeHotelInfo;

// ROUTE GPT - Création du systemPrompt avec mémoire de conversation
router.post('/chat', async (req, res) => {
  const { question, language } = req.body;
  
  // If this request is coming from Android speech-to-text, use the stored language
  // instead of trying to detect from the transcript
  let lang;
  if (req.session.androidUserLanguage && req.headers['user-agent'] && /Android/i.test(req.headers['user-agent'])) {
    lang = req.session.androidUserLanguage;
    console.log(`Using Android user selected language: ${lang} instead of detected language`);
  } else {
    // Use language from request or default to French
    lang = ['fr', 'en', 'es'].includes(language) ? language : 'fr';
  }
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // Dictionnaire de prompts système multilingues
  const systemPrompts = {
    fr: `Tu es Meit Ai, réceptionniste virtuelle. Réponds EXCLUSIVEMENT en français en utilisant uniquement les informations disponibles ci-dessous:

${hotelInfo[lang]}

Si tu ne sais pas ou si l'information demandée n'est pas présente dans les informations fournies, indique-le clairement sans rien inventer.
En tant que chatbot, ne prends aucune initiative qui pourrait te compromettre ou engager notre responsabilité. Ne propose pas aux clients des services ou actions qui ne sont pas explicitement mentionnés dans les informations fournies.

Obligation:
-Fournir le plus d'information util et importante a savoir a l'utilisateur. Ne pas hesitez a etre extensif.
-Toujours structurer tes réponses en paragraphes bien espacés.
-Utiliser des sauts de ligne entre chaque paragraphe pour une meilleure lisibilité.
-Tu dois TOUJOURS répondre en français, quelle que soit la langue de la question posée.

Règles complémentaires :
-Pas de numérotation
-Style conversationnel naturel
-Phrases complètes
-Structure claire sans formatage
-Chaque idée distincte doit être dans son propre paragraphe`,
    en: `You are Meit Ai, a virtual receptionist. Answer EXCLUSIVELY in English using only the information available below:

${hotelInfo[lang]}

If you do not know or if the requested information is not present in the information provided, clearly indicate so without making anything up.
As a chatbot, do not take any initiative that could compromise you or engage our liability. Do not offer clients any services or actions that are not explicitly mentioned in the information provided.

Requirements:
- Provide extensive and useful information to the user. Don't hesitate to be comprehensive.
- Always structure your responses in well-spaced paragraphs.
- Use line breaks between each paragraph for better readability.
- You must ALWAYS respond in English, regardless of the language of the question asked.

Additional rules:
- No numbering
- Natural conversational style
- Complete sentences
- Clear structure without formatting
- Each distinct idea should be in its own paragraph`,
    es: `Tú eres Meit Ai, recepcionista virtual. Responde EXCLUSIVAMENTE en español utilizando únicamente la información disponible a continuación:

${hotelInfo[lang]}

Si no sabes o si la información solicitada no está presente en la información proporcionada, indícalo claramente sin inventar nada.
Como chatbot, no tomes ninguna iniciativa que pueda comprometerte o implicar nuestra responsabilidad. No ofrezcas a los clientes servicios o acciones que no estén explícitamente mencionados en la información proporcionada.

Obligaciones:
- Proporcionar información extensa y útil al usuario. No dudes en ser exhaustivo.
- Siempre estructurar tus respuestas en párrafos bien espaciados.
- Usar saltos de línea entre cada párrafo para mejor legibilidad.
- SIEMPRE debes responder en español, independientemente del idioma de la pregunta formulada.

Reglas complementarias:
- Sin numeración
- Estilo conversacional natural
- Frases completas
- Estructura clara sin formato
- Cada idea distinta debe estar en su propio párrafo`
  };

  // Initialiser l'historique de conversation dans la session s'il n'existe pas
  if (!req.session.chatHistory) {
    req.session.chatHistory = [];
    // Ajouter le prompt système initial
    req.session.chatHistory.push({ role: 'system', content: systemPrompts[lang] });
  } else {
    // Force update the system prompt to use the current language on every request
    // This ensures the bot will always use the correct language based on the current request
    if (req.session.chatHistory.length > 0 && req.session.chatHistory[0].role === 'system') {
      req.session.chatHistory[0].content = systemPrompts[lang];
    } else {
      // Insert system prompt at the beginning if it doesn't exist
      req.session.chatHistory.unshift({ role: 'system', content: systemPrompts[lang] });
    }
  }

  // Ajouter la question de l'utilisateur à l'historique
  req.session.chatHistory.push({ role: 'user', content: question });

  try {
    // Appel à l'API OpenAI pour générer une réponse en utilisant l'historique complet
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modèle utilisé
        messages: req.session.chatHistory, // Utiliser l'historique complet de conversation
        max_tokens: 450, // Limite de tokens pour la réponse
        temperature: 1 // Niveau de créativité de la réponse
      })
    });

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur GPT:', errorText);
      return res.status(500).json({ answer: "Erreur lors de la génération de la réponse." });
    }

    // Extraire la réponse du modèle
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Désolé, je ne peux pas répondre pour l'instant.";
    // Ajouter la réponse du bot à l'historique de conversation
    req.session.chatHistory.push({ role: 'assistant', content: answer });
    res.json({ answer }); // Envoyer la réponse au client
  } catch (err) {
    console.error('Erreur interne GPT:', err);
    res.status(500).json({ answer: "Erreur interne du serveur." });
  }
});

// ROUTE STT (Whisper) - Utilisation du model gpt-4o-mini-transcribe
router.post('/speech-to-text', upload.single('file'), async (req, res) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    // Vérifier qu'un fichier a bien été envoyé
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier audio reçu.' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const compress = req.body.compress === 'true';
    // Extract the user selected language from Android
    const userSelectedLanguage = req.body.userSelectedLanguage;
    
    // If we have a user selected language from Android, store it in the session
    if (userSelectedLanguage && ['fr', 'en', 'es'].includes(userSelectedLanguage)) {
      console.log(`Android STT: User selected language is ${userSelectedLanguage}`);
      // Store this in the session for use in the chat endpoint
      req.session.androidUserLanguage = userSelectedLanguage;
    }

    // Log pour le débogage
    console.log(`Traitement audio: ${originalname}, taille: ${buffer.length} octets, compression: ${compress}, langue sélectionnée: ${userSelectedLanguage || 'non spécifiée'}`);

    // Création du Blob à partir du buffer reçu
    const audioBlob = new Blob([buffer], { type: mimetype || 'audio/wav' });

    // Construction du FormData pour l'API Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, originalname);
    formData.append('model', 'gpt-4o-mini-transcribe'); // Modèle Whisper à utiliser
    
    // Optimisation: utiliser le model tiny pour une réponse plus rapide sur Android
    // Ce modèle est plus rapide mais un peu moins précis
    if (compress) {
      formData.append('model', 'gpt-4o-mini-transcribe');
      // On peut ajouter d'autres paramètres d'optimisation ici
      // comme 'response_format': 'json' pour réduire la taille de la réponse
    }

    // Requête vers l'API Whisper pour la transcription
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    // Vérifier si la réponse est correcte
    if (!response.ok) {
      const errText = await response.text();
      console.error('Erreur Whisper:', errText);
      return res.status(500).json({ error: 'Erreur lors de la reconnaissance vocale.' });
    }

    // Extraire la transcription et l'envoyer au client
    const data = await response.json();
    res.json({ transcript: data.text });
  } catch (error) {
    console.error('Erreur STT Whisper:', error);
    res.status(500).json({ error: 'Erreur lors de la reconnaissance vocale.' });
  }
});

// ROUTE TTS (Whisper TTS)
router.post('/text-to-speech', async (req, res) => {
  const { text } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    // Log information about the request
    console.log(`[TTS] Processing text length: ${text.length} characters`);
    console.log(`[TTS] First 100 chars: ${text.substring(0, 100)}...`);
    
    // Check if text is empty or invalid
    if (!text || text.trim() === '') {
      console.error('[TTS] Empty or invalid text received');
      return res.status(400).send('Text cannot be empty');
    }
    
    // Max length per TTS request (OpenAI has a character limit)
    const MAX_CHUNK_LENGTH = 4000;
    
    // If text is shorter than limit, process normally
    if (text.length <= MAX_CHUNK_LENGTH) {
      console.log(`[TTS] Processing text as a single chunk (${text.length} chars)`);
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({ 
          model: "gpt-4o-mini-tts", 
          voice: "alloy", 
          input: text,
          response_format: "mp3",
          speed: 1.0
        })
      });

      if (!response.ok) {
        const errMessage = await response.text();
        console.error(`[TTS] OpenAI API error: ${response.status} - ${errMessage}`);
        return res.status(500).send('Erreur lors de la synthèse vocale.');
      }

      const audioData = await response.arrayBuffer();
      console.log(`[TTS] Audio generated successfully. Size: ${Buffer.byteLength(audioData)} bytes`);
      
      // Set proper headers for streaming audio
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(audioData),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      
      // Send the audio data
      res.send(Buffer.from(audioData));
    } 
    // For longer texts, split into chunks and process sequentially
    else {
      console.log(`[TTS] Long text detected (${text.length} chars). Splitting into chunks...`);
      
      // More robust sentence splitting with consideration for multilingual texts
      const sentences = text.match(/[^.!?]+[.!?]+|\s*$/g) || [];
      console.log(`[TTS] Split into ${sentences.length} sentences`);
      
      if (sentences.length === 0) {
        // Fallback if no sentences found (rare case)
        sentences.push(text);
      }
      
      const chunks = [];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if (!sentence || sentence.trim() === '') continue;
        
        // If adding this sentence exceeds the limit, start a new chunk
        if (currentChunk.length + sentence.length > MAX_CHUNK_LENGTH) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = sentence;
          } else {
            // If a single sentence is too long, split it by words
            const words = sentence.split(/\s+/);
            let tempChunk = '';
            
            for (const word of words) {
              if (tempChunk.length + word.length + 1 > MAX_CHUNK_LENGTH) {
                chunks.push(tempChunk);
                tempChunk = word;
              } else {
                tempChunk += (tempChunk.length > 0 ? ' ' : '') + word;
              }
            }
            
            if (tempChunk.length > 0) {
              currentChunk = tempChunk;
            }
          }
        } else {
          currentChunk += sentence;
        }
      }
      
      // Add the last chunk if there's anything left
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      
      console.log(`[TTS] Text divided into ${chunks.length} chunks for processing`);
      chunks.forEach((chunk, index) => {
        console.log(`[TTS] Chunk ${index+1} size: ${chunk.length} chars`);
      });
      
      // Process each chunk and collect audio data
      const audioChunks = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`[TTS] Processing chunk ${i+1}/${chunks.length} (${chunks[i].length} chars)`);
        
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({ 
            model: "gpt-4o-mini-tts", 
            voice: "alloy", 
            input: chunks[i],
            response_format: "mp3",
            speed: 1.0
          })
        });

        if (!response.ok) {
          const errMessage = await response.text();
          console.error(`[TTS] Error processing chunk ${i+1}: ${response.status} - ${errMessage}`);
          return res.status(500).send('Erreur lors de la synthèse vocale.');
        }

        const audioData = await response.arrayBuffer();
        console.log(`[TTS] Chunk ${i+1} audio generated. Size: ${Buffer.byteLength(audioData)} bytes`);
        audioChunks.push(Buffer.from(audioData));
      }
      
      // Combine all audio chunks
      const combinedAudio = Buffer.concat(audioChunks);
      console.log(`[TTS] All chunks processed. Total audio size: ${combinedAudio.length} bytes`);
      
      // Set proper headers for streaming audio
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(combinedAudio),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
      });
      
      // Send the combined audio data
      res.send(combinedAudio);
    }
  } catch (err) {
    console.error('Erreur interne TTS:', err);
    console.error(err.stack);
    res.status(500).send('Erreur lors de la synthèse vocale.');
  }
});

export default router; 