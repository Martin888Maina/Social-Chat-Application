const express  = require('express');
const routes   = express.Router();
const registerController = require('../controller/registerController');
const { verifyAccessToken } = require('../helpers/jwtHelper');
const upload   = require('../middleware/upload');

routes.post('/register',    registerController.register);
routes.post('/login',       registerController.login);
routes.post('/refresh-token', registerController.refreshToken);

routes.get('/user',              verifyAccessToken, registerController.getUser);
routes.get('/users',             verifyAccessToken, registerController.getAllUsers);
routes.get('/userById',          verifyAccessToken, registerController.getUserById);
routes.get('/userIdByUsername',  verifyAccessToken, registerController.getUserIdByUsername);

routes.patch('/updateProfile', verifyAccessToken, registerController.updateProfile);

// multer runs before the controller — file lands in req.file, URL fallback in req.body
routes.post('/updateProfilePictureUrl', verifyAccessToken, upload.single('profilePicture'), registerController.updateProfilePictureUrl);

module.exports = routes;
