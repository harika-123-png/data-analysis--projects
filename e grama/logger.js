// js/logger.js
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/**
 * logAction writes a log to Firestore 'logs' collection
 * @param {Object} db - Firestore db instance
 * @param {String} uid - user id (can be null)
 * @param {String} action - short action name
 * @param {Object} details - optional object with details
 */
export async function logAction(db, uid, action, details = {}) {
  try {
    await addDoc(collection(db, "logs"), {
      uid: uid || null,
      action,
      details,
      timestamp: serverTimestamp()
    });
    // also log to console for local debugging
    console.log("LOG:", action, details);
  } catch (err) {
    console.error("Failed to write log:", err);
  }
}
