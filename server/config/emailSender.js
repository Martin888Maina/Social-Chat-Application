const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (recipientEmail, resetLink) => {
    // credentials come from .env — never hardcode these
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: 'Password Reset Request',
        html: `
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the link below to proceed:</p>
            <p><a href="${resetLink}">Reset Password</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p>This link expires in 24 hours.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
