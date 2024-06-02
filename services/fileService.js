// import User from '../models/userModel';
// import File from '../models/fileModel';
// import { decodeBase64Image } from 'node-base64-image';
// import path from 'path';
// import fs from 'fs';

// const uploadFile = async (apiKey, file) => {
//   const user = await User.findOne({ apiKey });
//   if (!user) {
//     throw new Error('Invalid API key');
//   }
//   const filePath = path.join(__dirname, '../uploads', `${Date.now()}.png`);
//   fs.writeFileSync(filePath, decodeBase64Image(file));
//   const fileData = fs.readFileSync(filePath, 'base64');
//   await new File({ user: user._id, data: fileData }).save();
//   fs.unlinkSync(filePath);
// };

// module.exports = { uploadFile };