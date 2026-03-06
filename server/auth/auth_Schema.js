const Joi = require('joi');

const authSchema = Joi.object({
    firstname: Joi.string().trim().min(2).max(30).required(),
    lastname:  Joi.string().trim().min(2).max(30).required(),
    email:     Joi.string().trim().email().lowercase().required(),
    telephone: Joi.string().trim().pattern(/^[0-9]{10,15}$/).required(),
    password:  Joi.string().min(6).required(),
});

module.exports = { authSchema };
