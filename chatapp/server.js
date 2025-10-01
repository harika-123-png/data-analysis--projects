const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// In-memory data structures (for demo purposes)
const rooms = new Map(); // roomName -> {users: Map(socketId -> username)}
// helper to get room list with counts
function getRoomList() {
  const list = [];
  for (const [name, meta] of rooms.entries()) {
    list.push({ name, userCount: meta.users.size });
  }
  return list;
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // send available rooms on connection
  socket.emit("roomList", getRoomList());

  // create room
  socket.on("createRoom", (roomName, cb) => {
    roomName = (roomName || "").trim();
    if (!roomName) return cb && cb({ ok: false, error: "Room name required" });
    if (rooms.has(roomName)) {
      return cb && cb({ ok: false, error: "Room already exists" });
    }
    rooms.set(roomName, { users: new Map() });
    io.emit("roomList", getRoomList());
    cb && cb({ ok: true });
  });

  // join room with username
  socket.on("joinRoom", ({ roomName, username }, cb) => {
    username = (username || "").trim();
    if (!roomName || !username) return cb && cb({ ok: false, error: "Missing room or username" });
    const room = rooms.get(roomName) || null;
    if (!room) return cb && cb({ ok: false, error: "Room does not exist" });

    // Prevent duplicate usernames in same room
    for (const name of room.users.values()) {
      if (name.toLowerCase() === username.toLowerCase()) {
        return cb && cb({ ok: false, error: "Username already taken in this room" });
      }
    }

    // join socket.io room
    socket.join(roomName);
    room.users.set(socket.id, username);

    // attach metadata to socket
    socket.data = { roomName, username };

    // notify room
    const joinMsg = {
      from: "System",
      text: `${username} joined the room.`,
      ts: Date.now(),
      system: true,
    };
    io.to(roomName).emit("message", joinMsg);
    io.emit("roomList", getRoomList());
    cb && cb({ ok: true, roomMeta: { name: roomName, users: Array.from(room.users.values()) } });
  });

  // leave room
  socket.on("leaveRoom", (cb) => {
    const { roomName, username } = socket.data || {};
    if (!roomName) return cb && cb({ ok: false });
    const room = rooms.get(roomName);
    if (room) {
      room.users.delete(socket.id);
      socket.leave(roomName);
      const leaveMsg = { from: "System", text: `${username} left the room.`, ts: Date.now(), system: true };
      io.to(roomName).emit("message", leaveMsg);
      // if room empty, remove room
      if (room.users.size === 0) {
        rooms.delete(roomName);
      }
      io.emit("roomList", getRoomList());
    }
    socket.data = {};
    cb && cb({ ok: true });
  });

  // text message
  socket.on("sendMessage", (text, cb) => {
    const { roomName, username } = socket.data || {};
    if (!roomName || !username) return cb && cb({ ok: false, error: "Not in a room" });
    text = (text || "").trim();
    if (!text) return cb && cb({ ok: false, error: "Empty message" });

    const msg = { from: username, text, ts: Date.now() };
    io.to(roomName).emit("message", msg);
    cb && cb({ ok: true });
  });

  // request current users in room
  socket.on("getRoomUsers", (roomName, cb) => {
    const room = rooms.get(roomName);
    cb && cb(room ? Array.from(room.users.values()) : []);
  });

  socket.on("disconnect", () => {
    const { roomName, username } = socket.data || {};
    if (roomName && rooms.has(roomName)) {
      const room = rooms.get(roomName);
      room.users.delete(socket.id);
      const dmsg = { from: "System", text: `${username || "A user"} disconnected.`, ts: Date.now(), system: true };
      io.to(roomName).emit("message", dmsg);
      if (room.users.size === 0) rooms.delete(roomName);
      io.emit("roomList", getRoomList());
    }
    console.log("socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));