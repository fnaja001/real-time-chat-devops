const io = require("socket.io-client");
const socket = io("ws://localhost:3000", { auth: { token: "demo" } });

socket.on("connect", () => {
  console.log("✅ Connected to WebSocket server");
  socket.emit("join-room", "test");
  socket.emit("send-message", { room: "test", user: "tester", text: "Hello" });
});

socket.on("message", (data) => {
  console.log("📨 Received message:", data);
  socket.disconnect();
  console.log("Disconnected");
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});
