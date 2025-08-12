// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your config
const firebaseConfig = {
    apiKey: "AIzaSyDXoHJhBlvJU7WHAO_LYraDqz2J47o7jjM",
    authDomain: "pcec-86f0a.firebaseapp.com",
    projectId: "pcec-86f0a",
    storageBucket: "pcec-86f0a.firebasestorage.app",
    messagingSenderId: "537623247966",
    appId: "1:537623247966:web:42fb032ba9154be78d88cf",
    measurementId: "G-W08F1JXXHK"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, firebaseConfig };