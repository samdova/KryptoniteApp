import { createClient } from 'redis';

// Initialize Redis client
const redisClient = createClient({
  password: '3XbgL5TjZDTXkOhlUGX9mqek7TDD8Dmc',
  socket: {
    host: 'redis-17581.c57.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 17581
  }
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redisClient.connect().catch(console.err);

export default redisClient;

