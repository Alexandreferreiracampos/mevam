// Configuração do Firebase - SUBSTITUA COM SEUS DADOS
const firebaseConfig = {
  apiKey: "AIzaSyCHXCNs4z3cfKn_i6Jky5FnPbwc3TDF3FE",
  authDomain: "mevam-mulhers.firebaseapp.com",
  projectId: "mevam-mulhers",
  storageBucket: "mevam-mulhers.firebasestorage.app",
  messagingSenderId: "11065667935",
  appId: "1:11065667935:web:aae1b378f8aea2f33f06ea",
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
