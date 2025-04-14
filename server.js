const express = require('express');
const { createClient } = require('redis');
const zmq = require('zeromq');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

// Create HTTP server and bind Socket.IO to it
const server = createServer(app);
const io = new Server(server);

// Serve static frontend from "public" folder
app.use(express.static('public'));

// --- Redis Setup ---
const redisClient = createClient();

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.connect().then(() => {
  console.log('✅ Connected to Redis');
});

// --- ZeroMQ Pull Socket Setup ---
const zmqSocket = new zmq.Pull();

(async () => {
  await zmqSocket.bind('tcp://127.0.0.1:5555'); // Node binds, C++ connects
  console.log('🚀 ZeroMQ PULL socket bound to tcp://127.0.0.1:5555');

  for await (const [msg] of zmqSocket) {
    try {
      const jsonData = JSON.parse(msg.toString());
      console.log('📥 Received from ZeroMQ:', jsonData);

      // Store stringified JSON into Redis
      await redisClient.lPush('messageQueue', JSON.stringify(jsonData));

      // Emit parsed JSON to all connected WebSocket clients
      io.emit('counter', jsonData);
    } catch (err) {
      console.error('❌ Failed to parse JSON message:', err.message);
    }
  }
})();

// --- WebSocket Client Handling ---
io.on('connection', async (socket) => {
  console.log('🧑‍💻 New WebSocket client connected');

  try {
    // Instead of lPop, use lRange to get the latest 50 messages without removing them.
    const messages = await redisClient.lRange('messageQueue', 0, 1000);
    messages.forEach(msg => {
      const parsed = JSON.parse(msg);
      socket.emit('counter', parsed);
    });
  } catch (err) {
    console.error('❌ Redis LRANGE or JSON parse error:', err.message);
  }

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket client disconnected');
  });
});

// --- Start Server ---
server.listen(port, () => {
  console.log(`🌐 Server running at http://localhost:${port}`);
});
