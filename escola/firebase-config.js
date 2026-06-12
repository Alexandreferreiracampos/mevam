// Configuração do Firebase - SUBSTITUA COM SEUS DADOS
const firebaseConfig = {
  apiKey: "AIzaSyAUr-idlKU47bk0JjTgfNm63a-drjS-BTg",
  authDomain: "escola-11dbd.firebaseapp.com",
  projectId: "escola-11dbd",
  storageBucket: "escola-11dbd.firebasestorage.app",
  messagingSenderId: "749492565129",
  appId: "1:749492565129:web:e8cd82d0df64b06cd28258",
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
