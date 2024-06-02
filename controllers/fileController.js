import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import File from '../models/fileModel.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('file');  // 'file' is the name of the input field in Postman

const handleErrors = (err) => {
    console.log(err.message, err.code);
    let errors = { email: '', apiKey: '' };

    if (err.message === 'Email not registered') {
        errors.email = 'Email does not exist';
    }

    if (err.message === 'Email not confirmed') {
        errors.email = 'Email not confirmed. Please confirm your email first.';
    }

    if (err.code === 11000) {
        errors.email = 'Email already registered';
        return errors;
    }

    if (err.message.includes('user validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    if (err.message === 'User not found') {
        errors.email = 'User not found';
    }

    if (err.message === 'API key not found') {
        errors.apiKey = 'API key not found';
    }

    return errors;
};

const fileController = {
    uploadFile: asyncHandler(async (req, res) => {
        const { apikey } = req.params;

        // Use multer to handle file upload
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: 'File upload failed' });
            }

            try {
                const user = await User.findOne({ 'apiKeys.key': apikey, 'apiKeys.invalidated': false });

                if (!user) {
                    throw new Error('Invalid API key');
                }

                // Get the uploaded file
                const fileBuffer = req.file.buffer;

                // Convert the file to a base64 string
                const fileBase64 = fileBuffer.toString('base64');

                // Store the base64 string in the database
                await new File({ user: user._id, email: user.email, data: fileBase64 }).save();

                res.status(201).json({ message: 'File uploaded successfully' });
            } catch (err) {
                const errors = handleErrors(err);
                res.status(400).json({ errors });
            }
        });
    }),
};

export default fileController;
