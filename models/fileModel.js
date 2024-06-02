import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  data: { type: String, required: true }
});

module.exports = mongoose.model('File', fileSchema);