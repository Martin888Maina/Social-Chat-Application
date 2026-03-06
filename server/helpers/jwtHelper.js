// This file is where we will store our JWT code that assists in providing tokens to users
const JWT         = require('jsonwebtoken');
const createError = require('http-errors');

module.exports ={
    signAccessToken: (RegisterId)=>{
        return new Promise((resolve, reject)=>{
            const payload = {}
            const secret  = process.env.ACCESS_TOKEN_SECRET;
            const options = {
                // expiresIn: '1h',// should be seconds.
                expiresIn: '1h',
                issuer:'Chatapplication.com',
                audience: RegisterId,
            }

            JWT.sign(payload, secret, options, (error, token)=>{
                if(error){
                    console.log(error.message)
                    reject(createError.InternalServerError());
                }
                resolve(token);

            })
        })
    },

    // Middleware to verify access token
    //The following code is used to verify the signAccessTokens. It is an additional security feature to allow the system to detect alterations to the Access tokens
    verifyAccessToken:(req, res, next)=>{
        //We will use the verifyAccessToken to protect the routes.
        //The following code passes the key and incase of any errors (such as changing from A to a, or deleting certain values) to it will throw back an error message un-authorized.
        if(!req.headers['authorization']) return next(createError.Unauthorized());

        //The actual token value is stored inside the 'authorization' key word.
        const authHeader  = req.headers['authorization'];
        const bearerToken = authHeader.split( ' ' );
        const token       = bearerToken[1];
        JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload)=>{
            if (err){
                return next (createError.Unauthorized())
            }
            req.payload = payload;
            //incase I want to use the global error handler pass error inside of next as follows=> next(error);
            next();
        })
    },
    //The following code is used for the refresh tokens
    signRefreshToken:(RegisterId)=>{
        return new Promise((resolve, reject)=>{
            const payload = {}
            const secret  = process.env.REFRESH_TOKEN_SECRET;
            const options = {
                expiresIn: '1y',// should be longer than access tokens.
                issuer:'Chatapplication.com',
                audience: RegisterId,

            }
            JWT.sign(payload, secret, options, (error, token)=>{
                if(error) reject(error);
                resolve(token);
            })
        })
    },
    //The following code is used to verify the signRefreshTokens. It is an additional security feature to allow the system to detect alterations to the Refresh tokens
    verifyRefreshToken:(refreshToken)=>{
        return new Promise((resolve, reject)=>{
            JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload)=>{
                if(err) return reject(createError.Unauthorized());
                // if (err) {
                //     console.error('Error verifying refresh token:', err);
                //     return reject(createError.Unauthorized());
                //   }
                const registerId = payload.aud;

                resolve(registerId);
            });
        });
    },


}



// const Register  = require('../models/registerModels');


//How to ensure that tokenization in a system is done appropriately
//Use a verification system: That is: verifyAccessToken
//Generate keys automatically as opposed to manually. for example: access_token=6544;