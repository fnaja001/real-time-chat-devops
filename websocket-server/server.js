const { Server } = require("socket.io");
const Redis = require("ioredis");
const client = require("prom-client");

const http = require("http");
const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" }
});

// Redis pub/sub
const redisPub = new Redis({ host: process.env.REDIS_HOST || "redis-service" });
const redisSub = new Redis({ host: process.env.REDIS_HOST || "redis-service" });

// Prometheus metrics
const messagesCounter = new client.Counter({
  name: "chat_messages_total",
  help: "Total number of messages"
});
const connectionsGauge = new client.Gauge({
  name: "chat_connections_active",
  help: "Active WebSocket connections"
});

// Subscribe to cross-pod messages
redisSub.subscribe("chat-messages");
redisSub.on("message", (channel, msg) => {
  const { room, data } = JSON.parse(msg);
  io.to(room).emit("message", data);
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === "demo") return next();
  next(new Error("unauthorized"));
});

io.on("connection", (socket) => {
  connectionsGauge.inc();

  socket.on("join-room", (room) => {
    socket.join(room);
  });

  socket.on("send-message", async (data) => {
    messagesCounter.inc();
    // Save to MongoDB via REST API
    try {
      await fetch(`http://api-service:3001/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: data.room,
          user: data.user,
          text: data.text
        })
      });
    } catch (err) {
      console.error("Failed to save message", err);
    }
    redisPub.publish("chat-messages", JSON.stringify({
      room: data.room,
      data: { user: data.user, text: data.text, timestamp: Date.now() }
    }));
  });

  socket.on("disconnect", () => {
    connectionsGauge.dec();
  });
});

// Prometheus /metrics endpoint
const promClient = require("prom-client");
server.on("request", (req, res) => {
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", promClient.register.contentType);
    promClient.register.metrics().then(data => res.end(data));
  }
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/metrics') {
    // existing metrics code
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`WebSocket server on ${PORT}`));