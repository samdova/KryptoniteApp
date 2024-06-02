import redis from 'redis';
const client = redis.createClient({ url: process.env.REDIS_URL });

client.connect();

const setOTP = async (key, value) => {
  await client.setEx(key, 300, value); // OTP expires in 5 minutes
};

const getOTP = async (key) => {
  return await client.get(key);
};

module.exports = { setOTP, getOTP };