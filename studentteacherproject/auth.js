// auth.js
import { auth, db } from './init-firebase.js';

// DOM
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('register-form');
const teacherExtra = document.getElementById('teacher-extra');
const msg = document.getElementById('auth-msg');

// tabs
tabLogin.onclick = () => { tabLogin.classList.add('active'); tabRegister.classList.remove('active'); loginForm.classList.remove('hidden'); regForm.classList.add('hidden'); };
tabRegister.onclick = () => { tabRegister.classList.add('active'); tabLogin.classList.remove('active'); regForm.classList.remove('hidden'); loginForm.classList.add('hidden'); };

// show teacher fields for teacher registration
document.getElementById('reg-role').addEventListener('change', (e) => {
  teacherExtra.classList.toggle('hidden', e.target.value !== 'teacher');
});

async function logAction(userId,action,meta={}) {
  try { await db.collection('logs').add({ userId, action, meta, ts: new Date().toISOString() }); } catch(e){ console.error('log failed',e); }
}

// register
regForm.onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const dept = document.getElementById('reg-dept').value.trim();
  const subjects = (document.getElementById('reg-subjects').value||'').split(',').map(s=>s.trim()).filter(Boolean);

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email,password);
    await userCred.user.updateProfile({ displayName: name });

    // store user profile (pending approval for students if desired)
    const userDoc = {
      uid: userCred.user.uid,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      approved: role === 'student' ? false : true  // example: students require admin approve
    };
    if (role === 'teacher') {
      userDoc.department = dept;
      userDoc.subjects = subjects;
      userDoc.approved = true; // teachers can also be set to pending if wanted
    }
    await db.collection('users').doc(userCred.user.uid).set(userDoc);
    await logAction(userCred.user.uid, 'register', { role });

    msg.textContent = 'Registered. Admin will approve if required.';
    // optional: sign out so admin approves first
    await auth.signOut();
  } catch (err) {
    msg.textContent = 'Register error: '+err.message;
  }
};

// login
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('login-role').value;
  try {
    const userCred = await auth.signInWithEmailAndPassword(email,password);
    const doc = await db.collection('users').doc(userCred.user.uid).get();
    if (!doc.exists) {
      await auth.signOut();
      return msg.textContent = 'User profile missing. Contact admin.';
    }
    const profile = doc.data();
    if (profile.role !== role) {
      await auth.signOut();
      return msg.textContent = 'Role mismatch. Use correct role.';
    }
    if (profile.approved === false) {
      await auth.signOut();
      return msg.textContent = 'Account pending approval.';
    }
    await logAction(userCred.user.uid, 'login', { role });
    // redirect by role
    if (role === 'student') window.location='student.html';
    else if (role === 'teacher') window.location='teacher.html';
    else window.location='admin.html';
  } catch (err) {
    msg.textContent = 'Login error: ' + err.message;
  }
};
