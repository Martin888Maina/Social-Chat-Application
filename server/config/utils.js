// utils.js
//The following code generates tokens for forgot password functionality
const crypto = require('crypto');

const generateRandomToken = (length = 32) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        const token = buffer.toString('hex');
        resolve(token);
      }
    });
  });
};

module.exports = { generateRandomToken };

  