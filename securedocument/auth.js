// auth.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";
import { logAction } from "./logger.js";
import { showApp, showAuth, renderProfile } from "./ui.js";

/* Phone OTP flow uses reCAPTCHA. The recaptcha container must exist in DOM. */
let confirmationResult = null;

export async function initAuthUI() {
  // reCAPTCHA lazy init will be done when user clicks send OTP
}

export function sendOtp(phone) {
  // initialize reCAPTCHA
  window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
    'size': 'invisible'
  }, auth);

  return signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
    .then(cr => {
      confirmationResult = cr;
      return true;
    })
    .catch(err => {
      console.error('Phone sign-in error', err);
      throw err;
    });
}

export async function verifyOtpAndRegister(otp, { name, email, password, aadhaar, phone }) {
  if (!confirmationResult) throw new Error("No OTP sent.");
  const result = await confirmationResult.confirm(otp);
  // result.user is the phone-authenticated user. We'll now create email/pass user as well
  // If you prefer to use only phone auth, skip email registration. For this project we'll still create email account.
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Save profile to Firestore
  await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    phone,
    aadhaar,
    createdAt: new Date()
  });

  await logAction(user.uid, "register", { email, aadhaar });
  return user;
}

export async function loginEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await logAction(cred.user.uid, "login", { method: "email" });
  return cred.user;
}

export async function logout() {
  if (auth.currentUser) {
    await logAction(auth.currentUser.uid, "logout", {});
  }
  await signOut(auth);
  showAuth();
}

// returns profile object
export async function ensureUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  return null;
}
