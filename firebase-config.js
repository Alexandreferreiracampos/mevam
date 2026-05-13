// Configuração do Firebase - SUBSTITUA COM SEUS DADOS
const firebaseConfig = {
  apiKey: "AIzaSyBTUYi-5qIDi7hdVbxZ8XGDicvSYPwktns",
  authDomain: "evento-mevam.firebaseapp.com",
  projectId: "evento-mevam",
  storageBucket: "evento-mevam.firebasestorage.app",
  messagingSenderId: "661898488685",
  appId: "1:661898488685:web:ee759d915631fc6af1c864",
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
