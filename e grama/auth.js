// js/auth.js
import { firebaseConfig } from '../firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { logAction } from './logger.js';

let app, auth, db;

export function initApp() {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // bind register
  document.getElementById('btnRegister').addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value || 'user';
    if(!email || !password || !name) return alert('Name, email, password required');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // save profile with role in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, name, email, role, createdAt: new Date()
      });
      await logAction(db, user.uid, 'register', { name, role });
      alert('Registered. Redirecting to dashboard...');
      redirectByRole(role);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // bind login
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if(!email || !password) return alert('Email & password required');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const uDoc = await getDoc(doc(getFirestore(app), 'users', user.uid));
      const role = uDoc.exists() ? uDoc.data().role : 'user';
      await logAction(getFirestore(app), user.uid, 'login', { role });
      redirectByRole(role);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // default UI show login/welcome
  document.getElementById('login').style.display='block';
}

// get current user profile from Firestore
export async function getCurrentUser() {
  if(!auth) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if(user) {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if(uDoc.exists()) resolve(uDoc.data());
        else resolve({ uid: user.uid, email: user.email, role: 'user' });
      } else resolve(null);
    });
  });
}

// redirect helper
function redirectByRole(role){
  if(role === 'admin') window.location = 'admin.html';
  else if(role === 'staff') window.location = 'staff.html';
  else window.location = 'user-dashboard.html';
}

// used by admin/staff/user pages to protect route
export function authInit(requiredRole=null){
  if(!app){
    app = initializeApp(firebaseConfig);
  }
  auth = getAuth(app); db = getFirestore(app);

  onAuthStateChanged(auth, async (user) => {
    if(!user) {
      window.location = 'index.html';
      return;
    }
    const uDoc = await getDoc(doc(db, 'users', user.uid));
    const role = uDoc.exists() ? uDoc.data().role : 'user';
    if(requiredRole && role !== requiredRole) {
      alert('Access denied: role mismatch');
      window.location = 'index.html'; return;
    }
    // optionally show user info
    console.log('Signed in as', user.uid, role);
  });
}

// logout
export async function logout(){
  if(!app) app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  await signOut(auth);
  window.location = 'index.html';
}
