// init-firebase.js
// Replace the firebaseConfig object with your project's settings.
import firebase from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js';
import 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js';
import 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js';

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const app = firebase.app();
export const auth = firebase.auth();
export const db = firebase.firestore();
