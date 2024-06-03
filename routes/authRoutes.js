import express from 'express';
import userController from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Home Route
router.get('/', (req, res) => {
	res.send('Welcome to Kryptonian App BACKEND API');
});
// register 
router.post('/register', userController.register);
// confirm email
router.get('/confirm-email', userController.confirmEmail);
// login
router.post('/login', userController.login);
// verify login otp
router.post('/verify-otp', userController.verifyOTP);
// create new apikey
router.post('/api-key/create', protect, userController.createApiKey);
// invalidate apikey
router.post('/api-key/invalidate', protect, userController.invalidateApiKey);
// logout
router.post('/logout', protect, userController.logout);

export default router;