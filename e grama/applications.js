// js/applications.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { firebaseConfig } from '../firebaseConfig.js';
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { logAction } from './logger.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// apply to a service
export async function applyToService({ serviceId, data }) {
  try {
    const user = auth.currentUser;
    if(!user) throw new Error('Not authenticated');
    // fetch service title for convenience
    const sDoc = await getDoc(doc(db, 'services', serviceId));
    const serviceTitle = sDoc.exists() ? sDoc.data().title : '';
    const docRef = await addDoc(collection(db, 'applications'), {
      serviceId,
      serviceTitle,
      userId: user.uid,
      userEmail: user.email,
      data,
      status: 'Pending',
      appliedAt: new Date(),
      updatedAt: new Date()
    });
    await logAction(db, user.uid, 'apply_service', { applicationId: docRef.id, serviceId });
    return docRef;
  } catch (err) { console.error(err); throw err; }
}

// listen to all applications (admin)
export function listenApplications(callback) {
  const q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    callback(arr);
  });
}

// listen to apps for staff (for demo: all pending)
export function listenApplicationsForStaff(callback) {
  const q = query(collection(db, 'applications'), where('status', 'in', ['Pending','Needs Info']), orderBy('appliedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
    callback(arr);
  });
}

// update application status (staff/admin)
export async function updateApplicationStatus(appId, status) {
  try {
    const user = auth.currentUser;
    const ref = doc(db, 'applications', appId);
    await updateDoc(ref, { status, updatedAt: new Date(), processedBy: user.uid });
    await logAction(db, user.uid, 'update_application', { applicationId: appId, status });
  } catch (err) { console.error(err); throw err; }
}

// listen my applications for logged in user
export function listenMyApplications(callback) {
  onSnapshot(query(collection(db, 'applications'), orderBy('appliedAt','desc')), (snap) => {
    const user = auth.currentUser;
    const arr = [];
    snap.forEach(d => {
      const data = d.data();
      if(user && data.userId === user.uid) arr.push({ id: d.id, ...data });
    });
    callback(arr);
  });
}
