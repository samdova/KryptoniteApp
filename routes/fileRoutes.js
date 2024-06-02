import express from 'express';
import FileController from '../controllers/fileController';

const router = express.Router();

router.post('/upload', FileController.uploadFile);
module.exports = router;