// models/passwordModel.js
const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Register', // Assuming your user model is named 'User'
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;

