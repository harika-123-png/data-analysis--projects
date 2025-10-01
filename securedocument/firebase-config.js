// firebase-config.js
// This file initializes Firebase and exports the app and services.
// IMPORTANT: Replace firebaseConfig with your project's config.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optionally: set auth language
auth.useDeviceLanguage();
