// logger.js
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";

export async function logAction(uid, actionType, meta = {}) {
  try {
    await addDoc(collection(db, "logs"), {
      uid: uid || null,
      action: actionType,
      meta,
      ts: serverTimestamp()
    });
  } catch (e) {
    console.error("Logging failed", e);
  }
}

/* Fetch latest logs for display (not restricted; in production restrict) */
export async function fetchLogs(limit = 50) {
  const q = collection(db, "logs");
  const snaps = await (await import("https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js")).getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}
