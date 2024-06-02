import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';
import User from '../models/userModel.js'; 
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
// import { createClient } from 'redis.createClient();';

// Handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '' };

  // Incorrect email
  if (err.message === 'email not registered') {
    errors.email = 'Email does not exist';
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

// Initialize Redis client with explicit host and port
const redisClient = createClient({
  password: '3XbgL5TjZDTXkOhlUGX9mqek7TDD8Dmc',
  socket: {
    host: 'redis-17581.c57.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 17581
  }
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

redisClient.connect().catch(console.err);


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
  register: asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
      const user = new User({ email });
      await user.save();

      const token = Math.floor(100000 + Math.random() * 900000).toString();
      await redisClient.set(email, token, 'EX', 300); // Store OTP in Redis with 5-minute expiration

      const confirmUrl = `http://localhost:3000/api/auth/confirm-email?email=${email}&token=${token}`;
      await sendEmail(email, 'Kryptonite Email Confirmation', `Please confirm your email by clicking the following link: ${confirmUrl}`);

      res.status(201).json({ user: user._id, message: 'Registered successfully. Please check your email to confirm your registration.' });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  }),
  confirmEmail: asyncHandler(async (req, res) => {
    const { email, token } = req.query;

    try {
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

      // Delete the token from Redis
      await redisClient.del(email);

      res.status(200).json({ user: user._id, user_key: user.apikey, message: 'Email confirmed successfully' });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  }),
  login: asyncHandler(async (req, res) => {
    const { email } = req.body;
  
    try {
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
      await redisClient.set(email, otp, 'EX', 300); // Store OTP in Redis with 5-minute expiration
  
      await sendEmail(email, 'Kryptonite OTP Login Code', `Your OTP code is ${otp}`);
  
      res.status(200).json({ message: 'OTP sent to email', otp: otp });
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  }),

  // verifyOTP: asyncHandler(async (req, res) => {
  //   const { email, otp } = req.body;

  //   try {
  //     const storedOtp = await redis.get(email);

  //     if (storedOtp !== otp) {
  //       throw new Error('Invalid OTP');
  //     }

  //     const token = uuidv4(); // Generate JWT or any token
  //     // Optionally, store the token in the database or redis if you want to track active sessions

  //     res.status(200).json({ token });
  //   } catch (err) {
  //     const errors = handleErrors(err);
  //     res.status(400).json({ errors });
  //   }
  // })
};

export default userController;