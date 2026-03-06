//TASK - RENAME API.JS TO studentRoute.js
//This is for setting routes in our api.js file
const express = require('express');

const routes  = express.Router();

//importing the controller file.
const messageController     = require('../controller/messageController');// remember to export the file. using the commented lines of code.

const { verifyAccessToken } = require('../helpers/jwtHelper'); // jwtHelpers is imported into the students route since we are using accesstoken 

// POST route to save messages in the database
routes.post('/saveMessage', verifyAccessToken, messageController.SaveMessage);

// Route to fetch messages between two users
routes.get('/messages/:senderId/:receiverId', verifyAccessToken, messageController.GetMessagesBetweenUsers);

// Route to search messages between two users
routes.get('/search/:userId/:receiverId', verifyAccessToken, messageController.SearchMessages);

//Add messages to the database
routes.post('/message', verifyAccessToken,  messageController.AddMessage);

//The route code to get ALL messages without the id option is as follows:
routes.get('/messages', messageController.GetAllMessage);

//Get a list of messages from the database
routes.get('/messageById/:_id([0-9a-fA-F]{24})',  messageController.GetMessage);

//Update messages in the database
routes.patch('/updateMessage/:_id([0-9a-fA-F]{24})', verifyAccessToken,  messageController.ChangeMessage);

//Delete messages from the database
routes.delete('/deleteMessage/:_id([0-9a-fA-F]{24})', verifyAccessToken, messageController.EraseMessage);

module.exports = routes;

