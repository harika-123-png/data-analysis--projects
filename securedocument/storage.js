// storage.js
import { db, storage } from "./firebase-config.js";
import { ref as sref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-storage.js";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";
import { logAction } from "./logger.js";

/**
 * Upload a file, save metadata to firestore.
 * docData: { title, desc, ownerUid, ownerEmail, aadhaar, sharedWith: [aadhaar or email] }
 */
export async function uploadDocument(file, docData, onProgress) {
  const path = `documents/${docData.ownerUid}/${Date.now()}_${file.name}`;
  const storageRef = sref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', snapshot => {
      const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onProgress) onProgress(percent);
    }, err => reject(err), async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      const docRef = await addDoc(collection(db, "documents"), {
        title: docData.title || file.name,
        desc: docData.desc || "",
        ownerUid: docData.ownerUid,
        ownerEmail: docData.ownerEmail || null,
        ownerAadhaar: docData.ownerAadhaar || null,
        filePath: path,
        fileName: file.name,
        fileUrl: url,
        sharedWith: docData.sharedWith || [],
        createdAt: serverTimestamp()
      });
      await logAction(docData.ownerUid, "upload_document", { docId: docRef.id, title: docData.title });
      resolve({ id: docRef.id, url });
    });
  });
}

export async function listMyDocuments(uid) {
  const q = query(collection(db, "documents"), where("ownerUid", "==", uid), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listSharedWithUser(userIdentifier /* could be aadhaar or email */) {
  // look up documents that contain userIdentifier in sharedWith
  const q = query(collection(db, "documents"), where("sharedWith", "array-contains", userIdentifier), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function shareDocument(docId, shareTo /* string: aadhaar or email */ , actorUid) {
  const docRef = doc(db, "documents", docId);
  await updateDoc(docRef, { sharedWith: (/* merge handled by serverless update */) [] });
  // Workaround: fetch, append
  const docSnap = await (await getDocs(query(collection(db, "documents"), where("__name__", "==", docId)))).docs[0];
  const current = docSnap.data();
  const already = current.sharedWith || [];
  if (!already.includes(shareTo)) {
    await updateDoc(docRef, { sharedWith: [...already, shareTo] });
  }
  await logAction(actorUid, "share_document", { docId, shareTo });
  return true;
}

export async function deleteDocument(docId, actorUid) {
  // Delete metadata; should also delete storage object
  // get doc to read file path
  const q = query(collection(db, "documents"), where("__name__", "==", docId));
  const snaps = await getDocs(q);
  if (snaps.empty) throw new Error("Document not found");
  const docSnap = snaps.docs[0];
  const data = docSnap.data();
  // delete storage
  const fileRef = sref(storage, data.filePath);
  await deleteObject(fileRef).catch(e => console.warn("Storage delete may have failed:", e));
  // delete firestore doc
  await deleteDoc(doc(db, "documents", docId));
  await logAction(actorUid, "delete_document", { docId });
  return true;
}

export async function updateDocumentMetadata(docId, updates, actorUid) {
  await updateDoc(doc(db, "documents", docId), updates);
  await logAction(actorUid, "update_document", { docId, updates });
  return true;
}
