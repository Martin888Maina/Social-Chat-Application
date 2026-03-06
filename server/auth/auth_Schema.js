//This file holds the email and password validation npm package.
//Remember to import the auth_Schema.js file into the registerModels.js file.
// The following package is sufficient for email, password and telephone validation.

const Joi = require('joi');

const authSchema = Joi.object({
    firstname: Joi.string().min(2).max(30).required(),  // Firstname validation
    lastname: Joi.string().min(2).max(30).required(),   // Lastname validation
    email: Joi.string().email().required().lowercase(), // Email validation
    telephone: Joi.string().pattern(/^[0-9]{10,15}$/).required(), // Telephone validation with a regex pattern for 10-15 digits
    password: Joi.string().min(6).required(),           // Password validation
});

module.exports = { authSchema };



