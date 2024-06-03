import asyncHandler from 'express-async-handler';
import redisClient from '../config/redisClient.js'; // Ensure correct path

const protect = asyncHandler(async (req, res, next) => {
    // get token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if the Token is Provided 
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const email = await redisClient.get(token);

        // Check if the Token is valid and not expired
        if (!email) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        // make the authenticated user's email available to subsequent middleware functions and route handlers
        req.email = email; 
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
});

export default protect;