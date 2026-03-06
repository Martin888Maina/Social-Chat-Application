//This file holds the email and password validation npm package.
//Remember to import the auth_Login.js file into the registerModels.js file.
// The following package is sufficient for email and password validation for the login form.

// auth_Login.js
const Joi = require('joi');

const authLoginSchema = Joi.object({
    email: Joi.string().email().required().lowercase(), // Email validation
    password: Joi.string().min(6).required(),           // Password validation
});

module.exports = { authLoginSchema };
