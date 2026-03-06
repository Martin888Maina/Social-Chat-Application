const express = require('express');
const routes = express.Router();
const groupController = require('../controller/groupController');
const { verifyAccessToken } = require('../helpers/jwtHelper');

// Create a new group
routes.post('/groups', verifyAccessToken, groupController.CreateGroup);

// Add a member to a group
routes.post('/groups/:groupId/members', verifyAccessToken, groupController.AddMemberToGroup);

// Get all groups for a user
routes.get('/users/:userId/groups', verifyAccessToken, groupController.GetUserGroups);

// Send a message to a group
routes.post('/groups/:groupId/messages', verifyAccessToken, groupController.SendMessageToGroup);

// Get messages for a group
routes.get('/groups/:groupId/messages', verifyAccessToken, groupController.GetGroupMessages);


module.exports = routes;

