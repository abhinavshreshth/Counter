const zmq = require('zeromq');
const redisClient = require('../redis/client');

module.exports = async function startZMQ(io) {
  const sock = new zmq.Pull();
  await sock.bind('tcp://127.0.0.1:5555');
  console.log('📡 ZeroMQ PULL listening at tcp://127.0.0.1:5555');

  for await (const [msg] of sock) {
    try {
      const json = JSON.parse(msg.toString());

      // Save to Redis list
      await redisClient.lPush('messageQueue', JSON.stringify(json));
      await redisClient.lTrim('messageQueue', 0, 1000);

      // Broadcast to clients
      io.emit('counter', json);
    } catch (err) {
      console.error('❌ ZMQ message error:', err.message);
    }
  }
};
