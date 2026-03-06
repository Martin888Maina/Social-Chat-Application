const Joi = require('joi');

const authLoginSchema = Joi.object({
    email:    Joi.string().trim().email().lowercase().required(),
    password: Joi.string().min(6).required(),
});

module.exports = { authLoginSchema };
