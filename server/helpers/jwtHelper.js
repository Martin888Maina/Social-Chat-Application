const JWT         = require('jsonwebtoken');
const createError = require('http-errors');

module.exports = {
    signAccessToken: (RegisterId) => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret  = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                expiresIn: '1h',
                issuer: 'Chatapplication.com',
                audience: RegisterId,
            };
            JWT.sign(payload, secret, options, (error, token) => {
                if (error) reject(createError.InternalServerError());
                resolve(token);
            });
        });
    },

    // middleware that protects routes — reads the bearer token and attaches payload
    verifyAccessToken: (req, res, next) => {
        if (!req.headers['authorization']) return next(createError.Unauthorized());
        const authHeader  = req.headers['authorization'];
        const bearerToken = authHeader.split(' ');
        const token       = bearerToken[1];
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) return next(createError.Unauthorized());
            req.payload = payload;
            next();
        });
    },

    signRefreshToken: (RegisterId) => {
        return new Promise((resolve, reject) => {
            const payload = {};
            const secret  = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: '1y',
                issuer: 'Chatapplication.com',
                audience: RegisterId,
            };
            JWT.sign(payload, secret, options, (error, token) => {
                if (error) reject(error);
                resolve(token);
            });
        });
    },

    verifyRefreshToken: (refreshToken) => {
        return new Promise((resolve, reject) => {
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
                if (err) return reject(createError.Unauthorized());
                resolve(payload.aud);
            });
        });
    },
};