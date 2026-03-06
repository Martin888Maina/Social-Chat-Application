const createError = require('http-errors');
const bcrypt = require('bcrypt');
const Password = require('../models/passwordModel');
const Register = require('../models/registerModel'); // Your user model
const { sendPasswordResetEmail } = require('../config/emailSender');
const { generateRandomToken } = require('../config/utils');

module.exports = {
  forgotPassword: async (req, res, next) => {
    try {
      console.log('Received forgot password request'); // Log request received

      const { email } = req.body;
      console.log('Email received:', email); // Log the email received

      const user = await Register.findOne({ email }); // Use the correct model
      if (!user) {
        console.log('User not found for email:', email); // Log if user not found
        throw createError.NotFound('User not found');
      }
      console.log('User found:', user.email); // Log the found user

      const token = await generateRandomToken(); // Generate random token
      console.log('Generated reset token:', token); // Log the generated token

      const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expiration time (24 hours)
      console.log('Token expiration time:', expiration); // Log the expiration time

      await Password.create({ userId: user._id, token, expiresAt: expiration });
      console.log('Password reset token saved in database'); // Log token saved

      // Generate reset link
      const resetLink = `http://localhost:3000/PasswordReset?token=${token}`;
      console.log('Generated reset link:', resetLink); // Log the reset link

      // Send password reset email with token
      await sendPasswordResetEmail(email, resetLink);
      console.log('Password reset email sent to:', email); // Log email sent

      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Error in forgotPassword:', error); // Log the error details
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      console.log('Received reset password request'); // Log request received

      const { token, newPassword } = req.body;
      console.log('Token and new password received:', { token, newPassword }); // Log token and new password

      const passwordReset = await Password.findOne({ token });
      if (!passwordReset || passwordReset.expiresAt < new Date()) {
        console.log('Invalid or expired token:', token); // Log invalid/expired token
        throw createError.BadRequest('Invalid or expired token');
      }
      console.log('Valid token found:', token); // Log valid token

      const user = await Register.findById(passwordReset.userId);
      if (!user) {
        console.log('User not found for token:', token); // Log if user not found
        throw createError.NotFound('User not found');
      }
      console.log('User found for password reset:', user.email); // Log user found

      user.password = newPassword; // newPassword should be the plain text password
      await user.save();

      // Log the final stored hashed password to compare
      const updatedUser = await Register.findById(user._id);
      console.log('Stored hashed password after update:', updatedUser.password);

      // For password verification
      const match = await bcrypt.compare(newPassword, updatedUser.password);
      console.log('Password comparison result:', match);

      // Delete the used password reset token
      await Password.findByIdAndDelete(passwordReset._id);
      console.log('Password reset token deleted from database'); // Log token deletion

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error in resetPassword:', error); // Log the error details
      next(error);
    }
  },
};

