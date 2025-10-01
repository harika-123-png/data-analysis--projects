const socket = io();

const roomListEl = document.getElementById("roomList");
const createRoomBtn = document.getElementById("createRoomBtn");
const newRoomInput = document.getElementById("newRoomInput");
const usernameInput = document.getElementById("usernameInput");
const setUsernameBtn = document.getElementById("setUsernameBtn");
const currentRoomTitle = document.getElementById("currentRoomTitle");
const messagesEl = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const leaveBtn = document.getElementById("leaveBtn");
const userListEl = document.getElementById("userList");

let myUsername = localStorage.getItem("chat_username") || "";
if (myUsername) usernameInput.value = myUsername;
let currentRoom = null;

// helper: sanitize / format basic markup: **bold**, *italic*, links
function formatMessage(text) {
  // escape HTML
  const esc = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  // bold **text**
  let out = esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // italic *text*
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // links
  out = out.replace(/(https?:\/\/[^\s]+)/g, function (url) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
  return out;
}

function addMessage({ from, text, ts, system }, me = false) {
  const div = document.createElement("div");
  div.className = "message " + (system ? "system" : me ? "me" : "other");
  if (system) {
    div.innerHTML = `<div>${formatMessage(text)}</div><div class="meta">${new Date(ts).toLocaleString()}</div>`;
  } else {
    div.innerHTML = `<div class="meta">${from} • ${new Date(ts).toLocaleTimeString()}</div><div>${formatMessage(text)}</div>`;
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

socket.on("roomList", (rooms) => {
  roomListEl.innerHTML = "";
  rooms.sort((a,b)=>b.userCount - a.userCount);
  for (const r of rooms) {
    const li = document.createElement("li");
    li.textContent = r.name;
    const count = document.createElement("span");
    count.textContent = r.userCount;
    li.appendChild(count);
    li.onclick = () => attemptJoinRoom(r.name);
    roomListEl.appendChild(li);
  }
});

// set username
setUsernameBtn.addEventListener("click", () => {
  const val = usernameInput.value.trim();
  if (!val) return alert("Please enter username");
  myUsername = val;
  localStorage.setItem("chat_username", val);
  alert("Username set to " + val);
});

// create room
createRoomBtn.addEventListener("click", () => {
  const name = newRoomInput.value.trim();
  if (!name) return alert("Enter room name");
  socket.emit("createRoom", name, (res) => {
    if (!res.ok) return alert(res.error || "Could not create room");
    newRoomInput.value = "";
    attemptJoinRoom(name);
  });
});

function attemptJoinRoom(roomName) {
  if (!myUsername) {
    alert("Please set a username first.");
    return;
  }
  if (currentRoom === roomName) return;
  socket.emit("joinRoom", { roomName, username: myUsername }, (res) => {
    if (!res.ok) return alert(res.error || "Could not join");
    currentRoom = roomName;
    currentRoomTitle.textContent = "Room: " + roomName;
    messagesEl.innerHTML = "";
    // show current users
    socket.emit("getRoomUsers", roomName, (users) => {
      userListEl.textContent = "Users: " + users.join(", ");
    });
  });
}

// send message
sendBtn.addEventListener("click", () => {
  const txt = messageInput.value;
  if (!txt.trim()) return;
  socket.emit("sendMessage", txt, (res) => {
    if (!res.ok) return alert(res.error || "Failed to send");
    messageInput.value = "";
  });
});
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// leave room
leaveBtn.addEventListener("click", () => {
  if (!currentRoom) return alert("Not in a room");
  socket.emit("leaveRoom", (res) => {
    currentRoom = null;
    currentRoomTitle.textContent = "Not in a room";
    userListEl.textContent = "";
    messagesEl.innerHTML = "";
  });
});

// new messages from server
socket.on("message", (msg) => {
  const me = msg.from && msg.from.toLowerCase() === (myUsername || "").toLowerCase();
  addMessage(msg, me);
  // update user list if a system message about join/leave
  if (msg.system && currentRoom) {
    socket.emit("getRoomUsers", currentRoom, (users) => {
      userListEl.textContent = users.length ? "Users: " + users.join(", ") : "";
    });
  }
});