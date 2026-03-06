// emailSender.js
const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (recipientEmail, resetLink) => {
  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    // configure your mail server here
    // For example, for Gmail, you might use the following settings
    service: 'gmail',
    
    // // martmain.k@gmail.com email address
    auth: {
      user: 'martmain.k@gmail.com',
      pass: 'geon dnin iikr fkoa',
    },

    //martinkamaumaina2@gmail.com
    // auth: {
    //   user: 'martinkamaumaina2@gmail.com',
    //   pass: 'zchu lobc mmpc ugtk',
    // },
  });

  // Email content
  const mailOptions = {
    from: 'martmain.k@gmail.com',
    // from: 'martinkamaumaina2@gmail.com',
    to: recipientEmail,
    subject: 'Nodemailer: Password Reset Request',
    // text: `Click the following link to reset your password: ${resetLink}`,
    html: `
    <p>Hello,</p>
    <p>We received a request to reset your password. Please click the link below to reset your password:</p>
    <p><a href="${resetLink}">Reset Password</a></p>
    <p>If you did not request a password reset, you can ignore this email.</p>
    <br />
    <img src="https://images.unsplash.com/photo-1634224143538-ce0221abf732?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fHBhc3N3b3JkfGVufDB8fDB8fHww" alt="Company Logo" width="800" />
  `,
  
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };


