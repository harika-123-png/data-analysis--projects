// js/services.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { firebaseConfig } from '../firebaseConfig.js';
import { getFirestore, collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { logAction } from './logger.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export async function createService({ title, description }) {
  try {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, 'services'), {
      title, description, createdBy: user?.uid || null, isActive: true, createdAt: new Date()
    });
    await logAction(db, user?.uid, 'create_service', { serviceId: docRef.id, title });
    return docRef;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function updateService(id, updates) {
  try {
    const user = auth.currentUser;
    const serviceRef = doc(db, 'services', id);
    await updateDoc(serviceRef, { ...updates, updatedAt: new Date() });
    await logAction(db, user?.uid, 'update_service', { serviceId: id, updates });
  } catch (err) { console.error(err); throw err; }
}

export async function deleteService(id) {
  try {
    const user = auth.currentUser;
    await deleteDoc(doc(db, 'services', id));
    await logAction(db, user?.uid, 'delete_service', { serviceId: id });
  } catch (err) { console.error(err); throw err; }
}

// real-time listener to services collection
export function listenServices(callback) {
  const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach(d => {
      const data = d.data();
      arr.push({ id: d.id, ...data });
    });
    callback(arr);
  });
}

// helper to build a DOM card for a service
export function renderServiceCard(service, options = {}) {
  const div = document.createElement('div');
  div.className='service';
  div.dataset.id = service.id;
  div.dataset.title = service.title || '';
  div.innerHTML = `
    <h4>${service.title}</h4>
    <p class="small">${service.description || ''}</p>
    <div class="actions" style="margin-top:8px"></div>
  `;
  const actions = div.querySelector('.actions');
  if(options.showApply) {
    const btn = document.createElement('button');
    btn.textContent = 'Apply';
    btn.dataset.action = 'apply';
    btn.dataset.id = service.id;
    btn.dataset.title = service.title;
    actions.appendChild(btn);
  }
  if(options.showDelete) {
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.dataset.action = 'delete';
    del.dataset.id = service.id;
    actions.appendChild(del);
  }
  return div;
}
