import asyncHandler from 'express-async-handler';
import File from '../models/fileModel.js';

const imageController = {
    // get all images
    getAllImages: asyncHandler(async (req, res) => {
        const files = await File.find().populate('user', 'email');
        
        // Collect all images with their email, apikey and date uploaded
        const images = files.reduce((acc, file) => {
            const userImages = file.images.map(image => ({
                data: image.data,
                email: file.email,
                apiKey: image.apiKey,
                dateUploaded: image.dateUploaded,
            }));
            return acc.concat(userImages);   
        }, []);

        res.status(200).json(images);
    }),
    // get image by id
    getImage: asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Find the file containing the image with the given unique file image id
        const file = await File.findOne({ 'images._id': id }).populate('user', 'email');
        
        if (!file) {
            return res.status(404).json({ message: 'Image not found' });
        }
        
        // Find the specific image in the file's images array
        const image = file.images.id(id);
        
        const response = {
            data: image.data,
            email: file.email,
            apiKey: image.apiKey,
            dateUploaded: image.dateUploaded,
        };

        res.status(200).json(response);
    })
}

export default imageController;