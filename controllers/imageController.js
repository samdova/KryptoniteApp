import asyncHandler from 'express-async-handler';
import ImageService from '../services/imageService';

exports.getAllImages = asyncHandler(async (req, res) => {
  const images = await ImageService.getAllImages();
  res.status(200).json(images);
});

exports.getImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const image = await ImageService.getImage(id);
  res.status(200).json(image);
});