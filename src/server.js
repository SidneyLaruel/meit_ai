// server.js

// Importation des modules nécessaires
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import apiRoutes from './routes/apiRoutes.js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, '..', 'public');
console.log("Serving static files from:", publicPath);

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// INITIALISATION
const app = express();

// SSL Certificate configuration
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certificates', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certificates', 'server.cert'))
};

// Middleware de gestion de session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true, // Enable secure cookies for HTTPS
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'strict' // Protect against CSRF
    }
  })
);

// Serve static files from the public directory with explicit MIME type for .js
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use(express.json()); // Middleware pour parser les requêtes JSON

// Add root route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Récupérer la clé API depuis les variables d'environnement
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Vérifier que la clé API est bien chargée
if (!OPENAI_API_KEY) {
  console.error("Erreur : La clé API OpenAI n'est pas définie dans le fichier .env.");
  process.exit(1); // Arrêter le serveur si la clé n'est pas définie
}

// Initialize hotel info and use API routes
try {
  // Initialize hotel info from apiRoutes module
  await apiRoutes.initializeHotelInfo();
  // Mount the API routes
  app.use('/api', apiRoutes);
} catch (err) {
  console.error('Failed to initialize API routes:', err);
  process.exit(1);
}

// LANCEMENT DU SERVEUR
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3001;

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// Add this before your routes
app.use((req, res, next) => {
  if (!req.secure) {
    // HTTP request, redirect to HTTPS
    return res.redirect(`https://${req.hostname}:${HTTPS_PORT}${req.url}`);
  }
  next();
});

// Start both HTTP and HTTPS servers
app.listen(PORT, () => {
  console.log(`Serveur HTTP démarré sur le port ${PORT}`);
});

httpsServer.listen(HTTPS_PORT, () => {
  console.log(`Serveur HTTPS démarré sur le port ${HTTPS_PORT}`);
});