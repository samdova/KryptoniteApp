import express from 'express';
import fileController from '../controllers/fileController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// upload
router.post('/upload', protect, fileController.uploadFile);

export default router; 