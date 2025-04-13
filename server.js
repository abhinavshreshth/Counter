const express = require('express');
const { createClient } = require('redis');
const zmq = require('zeromq');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;
d


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
  console.log('Connected to Redis');
});

// --- ZeroMQ Pull Socket Setup ---
const zmqSocket = new zmq.Pull();

(async () => {
  await zmqSocket.bind('tcp://127.0.0.1:5555');  // Node.js binds, C++ connects
  console.log('ZeroMQ PULL socket bound to tcp://127.0.0.1:5555');

  for await (const [msg] of zmqSocket) {
    const counter = msg.toString();
    console.log('Received from ZeroMQ:', counter);

    // Push to Redis queue
    await redisClient.lPush('messageQueue', counter);

    // Emit to all connected WebSocket clients
    io.emit('counter', counter);
  }
})();

// --- Socket.IO Client Connections ---
io.on('connection', async (socket) => {
  console.log('New WebSocket client connected');

  const lastMsg = await redisClient.lPop('messageQueue');
  if (lastMsg) {
    socket.emit('counter', lastMsg);
  }

  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected');
  });
});

// --- Start Server ---
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
