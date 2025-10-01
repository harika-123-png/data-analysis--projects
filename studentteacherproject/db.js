// db.js
import { db } from './init-firebase.js';

// -- Logging helper
export async function logAction(userId, action, meta={}) {
  try {
    await db.collection('logs').add({ userId, action, meta, ts: new Date().toISOString() });
  } catch (e) { console.error('log failed', e); }
}

// -- Teachers
export async function addTeacher(data) {
  const ref = await db.collection('teachers').add({...data, createdAt: new Date().toISOString()});
  await logAction('system','addTeacher',{id:ref.id});
  return ref.id;
}
export async function listTeachers() {
  const snap = await db.collection('teachers').orderBy('name').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function getTeacherList(query='') {
  // simple search: name/department/subjects
  const q = (query || '').toLowerCase().trim();
  const results = await listTeachers();
  if (!q) return results;
  return results.filter(t =>
    (t.name||'').toLowerCase().includes(q) ||
    (t.department||'').toLowerCase().includes(q) ||
    (t.subjects||[]).join(' ').toLowerCase().includes(q)
  );
}
export async function deleteTeacher(id) {
  await db.collection('teachers').doc(id).delete();
  await logAction('system','deleteTeacher',{id});
}

// -- Appointments
export async function bookAppointment(payload) {
  // payload: studentId, studentName, teacherId, teacherName, datetime, purpose
  const doc = { ...payload, status: 'requested', createdAt: new Date().toISOString() };
  const ref = await db.collection('appointments').add(doc);
  await logAction(payload.studentId,'bookAppointment',{appointmentId:ref.id});
  return ref.id;
}
export function listenTeacherAppointments(teacherId, cb) {
  return db.collection('appointments').where('teacherId','==',teacherId).orderBy('createdAt','desc')
    .onSnapshot(snap => cb(snap.docs.map(d=>({ id:d.id, ...d.data() }))));
}
export function listenMyAppointments(studentId, cb) {
  return db.collection('appointments').where('studentId','==',studentId).orderBy('createdAt','desc')
    .onSnapshot(snap => cb(snap.docs.map(d=>({ id:d.id, ...d.data() }))));
}
export async function updateAppointmentStatus(id, status) {
  await db.collection('appointments').doc(id).update({ status, updatedAt: new Date().toISOString() });
  const appt = await db.collection('appointments').doc(id).get();
  const data = appt.data();
  await logAction('system','updateAppointmentStatus',{id,status,teacherId:data.teacherId});
  return true;
}

// -- Messages
export async function sendMessage(fromId, fromName, toTeacherId, text) {
  await db.collection('messages').add({ fromId, fromName, toTeacherId, text, createdAt: new Date().toISOString() });
  await logAction(fromId,'sendMessage',{to:toTeacherId});
}
export function listenMessagesForTeacher(teacherId, cb) {
  return db.collection('messages').where('toTeacherId','==',teacherId).orderBy('createdAt','desc')
    .onSnapshot(snap => cb(snap.docs.map(d=>({ id:d.id, ...d.data() }))));
}

// -- Admin student approvals
export async function getPendingStudents() {
  const snap = await db.collection('users').where('role','==','student').where('approved','==',false).get();
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function approveStudent(uid) {
  await db.collection('users').doc(uid).update({ approved:true });
  await logAction('system','approveStudent',{uid});
}
