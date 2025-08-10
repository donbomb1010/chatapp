// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/*
 Replace below with your Firebase config if different.
 You said your project is linked — keep these or replace with yours.
*/
const firebaseConfig = {
  apiKey: "AIzaSyDBxBohBzyABnH5qFDvCDkSMTpUXkqKdYU",
  authDomain: "chatapp-9d473.firebaseapp.com",
  projectId: "chatapp-9d473",
  storageBucket: "chatapp-9d473.appspot.com",
  messagingSenderId: "147747601861",
  appId: "1:147747601861:web:d6a6e7ee9e241b95731fac",
  measurementId: "G-RN00C3FL1D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, serverTimestamp };
