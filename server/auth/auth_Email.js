const Joi = require('joi');

const authEmail = Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
});

module.exports = { authEmail };
