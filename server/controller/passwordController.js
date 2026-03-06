const createError = require('http-errors');
const Password = require('../models/passwordModel');
const Register = require('../models/registerModel');
const { sendPasswordResetEmail } = require('../config/emailSender');
const { generateRandomToken } = require('../config/utils');

module.exports = {
    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;

            const user = await Register.findOne({ email });
            if (!user) throw createError.NotFound('User not found');

            const token = await generateRandomToken();
            const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await Password.create({ userId: user._id, token, expiresAt: expiration });

            const resetLink = `http://localhost:3000/PasswordReset?token=${token}`;
            await sendPasswordResetEmail(email, resetLink);

            res.status(200).json({ message: 'Password reset email sent' });
        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;

            const passwordReset = await Password.findOne({ token });
            if (!passwordReset || passwordReset.expiresAt < new Date()) {
                throw createError.BadRequest('Invalid or expired token');
            }

            const user = await Register.findById(passwordReset.userId);
            if (!user) throw createError.NotFound('User not found');

            user.password = newPassword;
            await user.save();

            // clean up the token once it's been used
            await Password.findByIdAndDelete(passwordReset._id);

            res.status(200).json({ message: 'Password reset successfully' });
        } catch (error) {
            next(error);
        }
    },
};

