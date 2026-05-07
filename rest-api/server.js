const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const promClient = require("prom-client");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://mongodb-service:27017/chat";

// Models
const User = mongoose.model("User", {
  username: String,
  password: String,
  rooms: [{ type: String }],
});

const Message = mongoose.model("Message", {
  room: String,
  user: String,
  text: String,
  timestamp: Date,
});

// Prometheus metrics
const httpRequestsCounter = new promClient.Counter({
  name: "chat_api_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestsCounter.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Health
app.get("/health", (req, res) => res.send("OK"));

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, rooms: ["general"] });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user._id, username }, JWT_SECRET);
  res.json({ token, username });
});

// Get rooms for user
app.get("/api/rooms", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    res.json({ rooms: user.rooms });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Create a new room
app.post("/api/rooms", async (req, res) => {
  const auth = req.headers.authorization;
  const { roomName } = req.body;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user.rooms.includes(roomName)) {
      user.rooms.push(roomName);
      await user.save();
    }
    res.json({ success: true });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get message history for a room
app.get("/api/messages/:room", async (req, res) => {
  const { room } = req.params;
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    const messages = await Message.find({ room }).sort({ timestamp: 1 }).limit(100);
    res.json({ messages });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// (Optional) save message to MongoDB when received (called by WebSocket server? Better to call API from WS)
// We'll integrate later.

mongoose.connect(MONGODB_URI).then(() => {
  console.log("MongoDB connected");
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API on port ${PORT}`));
});

app.post("/api/messages", async (req, res) => {
  const { room, user, text } = req.body;
  const msg = new Message({ room, user, text, timestamp: new Date() });
  await msg.save();
  res.json({ success: true });
});