const redisClient = require('../redis/client');

module.exports = function handleSocket(io) {
  io.on('connection', async (socket) => {
    console.log('🧑‍💻 WebSocket client connected');

    try {
      const messages = await redisClient.lRange('messageQueue', 0, 100);
      messages.reverse().forEach(msg => {
        try {
          const json = JSON.parse(msg);
          socket.emit('counter', json);
        } catch (_) {}
      });
    } catch (err) {
      console.error('❌ Redis/WebSocket error:', err.message);
    }

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected');
    });
  });
};
