//This code has been lifted from the studentController.js. Modify it accordingly to reflect the userController.js file
//registerController.js file is responsible for error handling for the register routes.
//The follwing code is correct

const mongoose               = require('mongoose');// importing the db connection
const Register               = require('../models/registerModel');// importing the model
const createError            = require('http-errors'); // importing the error handling
const { authSchema }         = require('../auth/auth_Schema'); //importing the email & password validation npm package for register form
const { authLoginSchema }    = require('../auth/auth_Login'); //importing the email & password validation npm package for login form
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwtHelper'); // importing the JWT package due to accessToken used in code

module.exports = {

    register: async (req, res, next) => {
        try {
            const result = await authSchema.validateAsync(req.body);
            const { email } = result;
            const exists = await Register.findOne({ email });
            if (exists) throw createError.Conflict(`${email} has already been registered`);

            const register = new Register(result);
            const savedRegister = await register.save();
            const accessToken = await signAccessToken(savedRegister.id);
            const refreshToken = await signRefreshToken(savedRegister.id);

            res.send({
                accessToken,
                refreshToken,
                user: {
                    firstname: savedRegister.firstname,
                    lastname: savedRegister.lastname,
                    email: savedRegister.email,
                },
            });
        } catch (error) {
            if (error.isJoi) {
                return next(createError.BadRequest(error.details[0].message));
            }
            next(error);
        }
    },

    login: async (req, res, next) => {
        try {
            const result = await authLoginSchema.validateAsync(req.body);
            const register = await Register.findOne({ email: result.email });
            if (!register) throw createError.NotFound('User is not registered');

            const isMatch = await register.isValidPassword(result.password);
            if (!isMatch) throw createError.Unauthorized('Invalid email or password');

            const accessToken = await signAccessToken(register.id);
            const refreshToken = await signRefreshToken(register.id);

            res.send({
                accessToken,
                refreshToken,
                user: {
                    firstname: register.firstname,
                    lastname: register.lastname,
                    email: register.email,
                },
            });
        } catch (error) {
            if (error.isJoi) {
                return next(createError.BadRequest('Invalid email or password'));
            }
            next(error);
        }
    },

    // RefreshToken code
    refreshToken: async (req, res, next)=>{
        try{
            const { refreshToken }     = req.body;
            if(!refreshToken) throw createError.BadRequest();
            const registerId           = await verifyRefreshToken(refreshToken);

            const accessToken          = await signAccessToken(registerId);
            const refToken             = await signRefreshToken(registerId);

            res.send({ accessToken:accessToken, refreshToken:refToken });

        }catch(error){
            next(error);
        }
    },

    getUser: async (req, res, next) => {
        try {
            const registerId = req.payload.aud; // Extract registerId from JWT token payload
            const user = await Register.findById(registerId, 'firstname lastname email telephone profilePicture'); // Fetch all required fields
    
            if (!user) throw createError.NotFound('User not found');
    
            res.send({
                _id: user._id, // Ensure _id is included
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                telephone: user.telephone,
                profilePicture: user.profilePicture
            });
        } catch (error) {
            next(error);
        }
    },

   

    getUserById: async (req, res, next) => {
        try {
            const registerId = req.payload.aud; // Extract registerId from JWT token payload
            const user = await Register.findById(registerId, 'firstname lastname'); // Fetch name fields
    
            if (!user) throw createError.NotFound('User not found');
    
            res.send({
                userId: user._id,
                firstname: user.firstname,
                lastname: user.lastname
            });
        } catch (error) {
            next(error);
        }
    },

    getUserIdByUsername: async (req, res, next) => {
        try {
            const { username } = req.query; // Get username from query parameters
            if (!username) throw createError.BadRequest('Username is required');

            const user = await Register.findOne({ firstname: username }, '_id');
            if (!user) throw createError.NotFound('User not found');

            res.send({
                userId: user._id
            });
        } catch (error) {
            next(error);
        }
    },

    // Fetch all users with their IDs, names, email, telephone, and profile picture
    getAllUsers: async (req, res, next) => {
        try {
            const users = await Register.find({}, 'firstname lastname _id email telephone profilePicture'); // Select the fields you need

            if (!users || users.length === 0) throw createError.NotFound('No users found');

            res.send(users);
        } catch (error) {
            next(error);
        }
    },

    // Existing method to update profile information
    updateProfile: async (req, res, next) => {
        try {
            const userId = req.payload.aud; // Extract user ID from JWT token payload
            const { firstname, lastname, email, telephone } = req.body;

            // Update user profile information
            const updatedUser = await Register.findByIdAndUpdate(userId, {
                firstname,
                lastname,
                email,
                telephone
            }, { new: true });

            if (!updatedUser) throw createError.NotFound('User not found');

            res.send({
                firstname: updatedUser.firstname,
                lastname: updatedUser.lastname,
                email: updatedUser.email,
                profilePicture: updatedUser.profilePicture
            });
        } catch (error) {
            next(error);
        }
    },

    updateProfilePictureUrl: async (req, res, next) => {
        try {
            const userId = req.payload.aud; // Extract user ID from JWT token payload
            const { profilePictureUrl } = req.body;
    
            // Update profile picture URL
            const updatedUser = await Register.findByIdAndUpdate(userId, {
                profilePicture: profilePictureUrl
            }, { new: true });
    
            if (!updatedUser) throw createError.NotFound('User not found');
    
            res.send({
                profilePicture: updatedUser.profilePicture
            });
        } catch (error) {
            next(error);
        }
    }
}

    
