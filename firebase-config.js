/* =========================================================
   Configuration Firebase de NextGenIT
   1. https://console.firebase.google.com → Ajouter un projet
   2. Ajoutez une application Web (icône </>) et copiez ici les
      valeurs de « firebaseConfig ».
   3. Créez la base « Firestore Database » et collez les règles
      du fichier firestore.rules (voir README).
   Tant que apiKey est vide, le site fonctionne en mode local
   (données gardées dans le navigateur).
   ========================================================= */
/* Configuration actuelle : projet Firebase « dsk-congo » (le même que le site DSK,
   qui fonctionne déjà sur GitHub). Les données de NextGenIT sont rangées à part,
   dans la collection « nextgenit ». Remplacez par votre propre projet NextGenIT
   dès qu'il est créé. */
window.NG_FIREBASE = {
  apiKey: "AIzaSyCvDvCtNilW2gmqHmAR6PusGNFtyEG7sXo",
  authDomain: "dsk-congo.firebaseapp.com",
  projectId: "dsk-congo",
  storageBucket: "dsk-congo.firebasestorage.app",
  messagingSenderId: "1044575999853",
  appId: "1:1044575999853:web:4f041837300e956e8a2c64"
};

/* Assistant IA des étudiants : recherche Google (facultatif, 100 recherches gratuites par jour).
   1. https://programmablesearchengine.google.com → créez un moteur « Rechercher sur tout le Web » → copiez l'identifiant (cx).
   2. https://console.cloud.google.com → API « Custom Search API » → Identifiants → Créer une clé API (limitez-la à votre site).
   Sans clé, l'assistant utilise Wikipédia, DuckDuckGo et Stack Exchange. */
window.NG_GOOGLE = { cle: "", cx: "" };

/* Rappels automatiques (facultatif) : adresse d'un service qui envoie les WhatsApp/SMS sans clic
   (ex. une fonction Firebase reliée à WhatsApp Business ou à un fournisseur de SMS).
   Il reçoit chaque jour : { expediteur, messages: [{ telephone, nom, message, type }] }. */
window.NG_RAPPELS_URL = "";
