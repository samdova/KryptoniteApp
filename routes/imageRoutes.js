import express from 'express';
import ImageController from '../controllers/imageController';

const router = express.Router();

router.get('/images', ImageController.getAllImages);
router.get('/images/:id', ImageController.getImage);

module.exports = router;