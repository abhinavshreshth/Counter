const { createClient } = require('redis');
const redisClient = createClient();

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch((err) => console.error('❌ Redis connection failed:', err));

module.exports = redisClient;
