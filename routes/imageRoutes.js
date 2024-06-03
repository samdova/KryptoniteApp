import express from 'express';
import imageController from '../controllers/imageController.js';

const router = express.Router();
// get all images
router.get('/images', imageController.getAllImages);
// get image by id
router.get('/images/:id', imageController.getImage);

export default router;