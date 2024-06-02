// Import the redis client
import redisClient from '../config/redis.js';


const validateSession = async (req, res, next) => {
    try {
        // Ensure that req.user is defined
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = req.user._id;
        const sessionKey = await redisClient.get(userId.toString());

        const exists = await redisClient.exists(sessionKey);
        if (!exists) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        next();
    } catch (error) {
        console.error('Error checking session in Redis:', error);
        return res.status(500).json({ message: 'Internal Server Error: ' + error.message });
    }
};
  
export default validateSession;