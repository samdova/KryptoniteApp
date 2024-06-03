import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';
import User from '../models/userModel.js'; 
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redisClient.js';

// Handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', otp: '', apiKey: '', token: '' };

  // Incorrect email
  if (err.message === 'email not registered') {
    errors.email = 'Email does not exist';
  }
  if (err.message === 'Email is required') {
    errors.email = 'Input Email, email is required';
  }
  if (err.message === 'Invalid or expired token') {
    errors.otp = 'Invalid or expired link';
  }
  if (err.message === 'API key already exists') {
    errors.apiKey = 'API key already exists';
  }
  if (err.message === 'API key is required') {
    errors.apiKey = 'API key is required';
  }
  if (err.message === 'Token is required') {
    errors.token = 'Input Token, token is required';
  }
  if (err.message === 'otp is required') {
    errors.otp = 'otp is required';
  }
  
  // Duplicate error code
  if (err.code === 11000) {
    errors.email = 'Email already registered';
    return errors;
  }
  // Validation errors
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

const generateApiKey = () => {
  return Math.random().toString(36).substr(2); // Generate a random string as an API key
};

// Send email function
async function sendEmail(email, subject, text) {
  // Setup nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tsnsamdova@gmail.com',
      pass: 'yeuencpbmirbvyrj',
    },
  });

  const mailOptions = {
    from: 'Kryptonite',
    to: email,
    subject: subject,
    text: text,
  };
  // Send the email
  await transporter.sendMail(mailOptions);
};

const userController = {
  // register
  register: asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
          throw new Error('Email already registered');
      }
 
      const apiKey = generateApiKey();
      const newUser = new User({
          email,
          apiKeys: [{
              key: apiKey,
              version: 1,
              invalidated: false,
          }],
      });

      await newUser.save();

      // Generate a new token
      const token = Math.floor(100000 + Math.random() * 900000).toString();

      // Store the token in Redis with expiration time of 1 hour (3600 seconds)
      await redisClient.set(email, token, 'EX', 3600);

      const confirmUrl = `https://kryptoniteapp-lefa.onrender.com/api/auth/confirm-email?email=${email}&token=${token}`;
      
      // Email Confirmation 
      await sendEmail(email, 'Kryptonite Email Confirmation', `Please confirm your email by clicking the following link: ${confirmUrl} . The link expires in One hour`);

      res.status(201).json({ user: newUser._id, message: 'Registered successfully. Please check your email to confirm your registration. The link expires in One hour', otp: token });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
  }), 
  // confirm email
  confirmEmail: asyncHandler(async (req, res) => {
    const { email, token } = req.query;
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      if (!token) {
        throw new Error('Token is required');
      }
      const storedToken = await redisClient.get(email);
      if (storedToken !== token) {
        throw new Error('Invalid or expired token');
      }
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }
      user.confirmed = true;
      await user.save();
      // Delete the token from Redis after confirming
      await redisClient.del(email);
      res.status(200).json({ user: user._id, user_key: user.apikey, message: 'Email confirmed successfully', next: '/login' });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  }),
  // login
  login: asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      const user = await User.findOne({ email });
      if (!user) {
        res.status(206).json({ message: 'Email not registered' });
        return;
      }
      if (!user.confirmed) {
        res.status(207).json({ message: 'Email not confirmed' });
        return;
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP in Redis with 5 minute expiration
      await redisClient.set(email, otp, 'EX', 300);  
      // Email OTP
      await sendEmail(email, 'Kryptonite OTP Login Code', `Your OTP code is ${otp}, expires in 5 minute`);
      res.status(200).json({ message: 'OTP sent to email', otp: otp, next: '/verify-otp' });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  }),
  // verify login with otp
  verifyOTP: asyncHandler(async (req, res) => {
    
    const { email, otp } = req.body;
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      if (!otp) {
        throw new Error('otp is required');
      }

      const storedOtp = await redisClient.get(email);
      if (storedOtp !== otp) {
        throw new Error('Invalid OTP');
      }
      // Generate a token with UUID in this case
      const token = uuidv4();  
      // Store token in Redis with 1-hour expiration
      await redisClient.set(token, email, 'EX', 3600);  
      res.status(200).json({ token });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  }),
  // create new apikey
  createApiKey: asyncHandler(async (req, res) => {
    const { email, apiKey } = req.body;
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      if (apiKey) {
        throw new Error('API key is required');
      }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        // checking if the supplied apikey matches the one affilated with the email
        const existingApiKey = user.apiKeys.find(keyObj => keyObj.key === apiKey);
        if (existingApiKey) {
            throw new Error('API key already exists');
        }

        // increment the version value of the apikey 
        const newVersion = user.apiKeys.length + 1;
        // the suppliied api key is assign to the key (incase the user doesn't provide it, it assign a unique key(uuidv4()), assign our version and Indicates that the new API key is valid and has not been invalidated)
        const newApiKey = { key: apiKey || uuidv4(), version: newVersion, invalidated: false };
        user.apiKeys.push(newApiKey);

        await user.save();
        res.status(201).json({ apiKey: newApiKey });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
  }),
  // invalidate apikey
  invalidateApiKey: asyncHandler(async (req, res) => {
    const { email, apiKey } = req.body;

  try {
    if (!email) {
      throw new Error('Email is required');
    }
    if (apiKey) {
      throw new Error('API key is required');
    }
      const user = await User.findOne({ email });
      if (!user) {
          throw new Error('User not found');
      }

      const apiKeyToInvalidate = user.apiKeys.find(key => key.key === apiKey);
      if (!apiKeyToInvalidate) {
          throw new Error('API key not found');
      }

      apiKeyToInvalidate.invalidated = true;

      await user.save();
      res.status(200).json({ message: 'API key invalidated successfully' });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }

  }),
  // logout 
  logout: asyncHandler(async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');

    try {
        await redisClient.del(token); // Remove the token from Redis

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
    }
  })
};

export default userController;