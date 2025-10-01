// ui.js
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import { loginEmail, logout, sendOtp, verifyOtpAndRegister, ensureUserProfile } from "./auth.js";
import { uploadDocument, listMyDocuments, deleteDocument } from "./storage.js";
import { logAction } from "./logger.js";

const $ = sel => document.querySelector(sel);

export function showAuth() {
  $("#app-area").classList.add("hidden");
  $("#auth-area").classList.remove("hidden");
}

export function showApp() {
  $("#auth-area").classList.add("hidden");
  $("#app-area").classList.remove("hidden");
}

/* Render profile area */
export async function renderProfile(uid) {
  const p = await ensureUserProfile(uid);
  $("#profile-info").innerHTML = p ? `
    <div><strong>${p.name}</strong></div>
    <div>${p.email || ""}</div>
    <div>Aadhaar: ${p.aadhaar || "-"}</div>
    <div>Phone: ${p.phone || "-"}</div>
  ` : "<div>No profile found</div>";
  $("#welcome").innerText = p ? `Welcome, ${p.name}` : "Welcome";
}

/* Render documents */
export async function renderDocuments(uid) {
  const docs = await listMyDocuments(uid);
  const container = $("#docs-list");
  container.innerHTML = "";
  if (docs.length === 0) container.innerHTML = "<p class='muted'>No documents uploaded yet.</p>";
  docs.forEach(d => {
    const el = document.createElement("div");
    el.className = "doc-item";
    el.innerHTML = `
      <div class="doc-meta">
        <div><strong>${d.title}</strong></div>
        <div class="muted">${d.desc || ""}</div>
        <div class="muted">Shared with: ${(d.sharedWith||[]).join(", ") || "—"}</div>
      </div>
      <div class="doc-actions">
        <a href="${d.fileUrl}" target="_blank"><button class="secondary">View</button></a>
        <button data-id="${d.id}" class="btn-delete">Delete</button>
      </div>
    `;
    container.appendChild(el);
  });
  // hook delete
  document.querySelectorAll(".btn-delete").forEach(b => {
    b.addEventListener("click", async e => {
      const id = e.target.dataset.id;
      if (!confirm("Delete this document?")) return;
      await deleteDocument(id, auth.currentUser.uid);
      await renderDocuments(auth.currentUser.uid);
      await logAction(auth.currentUser.uid, "ui_delete_click", { docId: id });
    });
  });
}

/* Render logs (simple) */
export async function renderLogs() {
  // naive: fetch last 40 logs
  const module = await import("./logger.js");
  const logs = await module.fetchLogs();
  const container = $("#logs-list");
  container.innerHTML = logs.slice(0,50).map(l => `<div><small>${l.ts ? new Date(l.ts.seconds*1000).toLocaleString() : ""}</small><div>${l.action} ${JSON.stringify(l.meta)}</div></div>`).join("");
}

/* Wire authentication UI */
export function wireAuthControls() {
  $("#show-register").addEventListener("click", e => {
    e.preventDefault();
    $("#login-section").classList.add("hidden");
    $("#register-section").classList.remove("hidden");
  });
  $("#show-login").addEventListener("click", e => {
    e.preventDefault();
    $("#register-section").classList.add("hidden");
    $("#login-section").classList.remove("hidden");
  });
  $("#btn-login").addEventListener("click", async () => {
    const email = $("#login-email").value.trim();
    const pass = $("#login-password").value;
    try {
      await loginEmail(email, pass);
    } catch (e) {
      alert("Login failed: " + e.message);
    }
  });
  $("#btn-logout").addEventListener("click", async () => {
    await logout();
  });

  // Send OTP
  $("#btn-send-otp").addEventListener("click", async () => {
    const phone = $("#reg-phone").value.trim();
    try {
      await sendOtp(phone);
      alert("OTP sent to " + phone);
    } catch (e) {
      alert("Failed to send OTP: " + e.message);
    }
  });
  // Verify and register
  $("#btn-verify-otp").addEventListener("click", async () => {
    try {
      const otp = $("#reg-otp").value.trim();
      const name = $("#reg-name").value.trim();
      const email = $("#reg-email").value.trim();
      const password = $("#reg-password").value;
      const aadhaar = $("#reg-aadhaar").value.trim();
      const phone = $("#reg-phone").value.trim();
      const user = await verifyOtpAndRegister(otp, { name, email, password, aadhaar, phone });
      alert("Registered: " + user.email);
    } catch (e) {
      alert("Registration failed: " + e.message);
    }
  });
}

/* Wire app area controls (upload etc) */
export function wireAppControls() {
  $("#btn-upload").addEventListener("click", async () => {
    const fileInput = $("#file-input");
    const file = fileInput.files[0];
    if (!file) return alert("Choose a file");
    const title = $("#doc-title").value.trim();
    const desc = $("#doc-desc").value.trim();
    const shareAad = $("#share-aadhaar").value.trim();
    const shareEmail = $("#share-email").value.trim();
    const sharedWith = [];
    if (shareAad) sharedWith.push(shareAad);
    if (shareEmail) sharedWith.push(shareEmail);

    try {
      const res = await uploadDocument(file, {
        title, desc,
        ownerUid: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email,
        ownerAadhaar: null,
        sharedWith
      }, percent => {
        // could show progress
        console.log('progress', percent);
      });
      alert("Uploaded: " + res.id);
      await renderDocuments(auth.currentUser.uid);
      await renderLogs();
    } catch (e) {
      console.error(e);
      alert("Upload failed: " + e.message);
    }
  });
}

/* Listen to auth state */
export function wireAuthState() {
  onAuthStateChanged(auth, async user => {
    if (user) {
      showApp();
      await renderProfile(user.uid);
      await renderDocuments(user.uid);
      await renderLogs();
    } else {
      showAuth();
    }
  });
}
