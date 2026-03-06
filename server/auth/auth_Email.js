//This is the email authentication file for the forgot password functionality

const Joi = require('joi');

const authEmail = Joi.object({
    email: Joi.string().email().required().lowercase(),
});

module.exports = { authEmail };





