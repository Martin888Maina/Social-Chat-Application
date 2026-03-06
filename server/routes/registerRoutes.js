//This code has been lifted from the api.js.Modify it accordingly to reflect the userRoutes.js file
//registerRoutes.js file handles the routing for the project
//The following code requires editing
const express = require('express');
const routes  = express.Router();

// const Register = require('../models/registerModels');
const registerController = require('../controller/registerController');
const { verifyAccessToken } = require('../helpers/jwtHelper');

// for user registration
routes.post('/register', registerController.register);

// for user login (this returns both the access and refresh tokens)
routes.post('/login', registerController.login);

// New route to update user profile with new profile picture URL
routes.patch('/updateProfile', verifyAccessToken, registerController.updateProfile);

// Route to update user profile picture URL using POST
routes.post('/updateProfilePictureUrl', verifyAccessToken, registerController.updateProfilePictureUrl);


// to refresh the access tokens using the refresh token
routes.post('/refresh-token', registerController.refreshToken);

// Route to get user info (first name)
routes.get('/user', verifyAccessToken, registerController.getUser);

// Route to fetch all users with their names and IDs
routes.get('/users', verifyAccessToken, registerController.getAllUsers);

// New route to get user ID
routes.get('/userById', verifyAccessToken, registerController.getUserById);

// Route to get user ID by username
routes.get('/userIdByUsername', verifyAccessToken, registerController.getUserIdByUsername);

module.exports = routes;
