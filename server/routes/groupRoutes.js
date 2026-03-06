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

// Get all members of a group
routes.get('/groups/:groupId/members', verifyAccessToken, groupController.GetGroupMembers);

// Remove a member from a group (creator only)
routes.delete('/groups/:groupId/members/:userId', verifyAccessToken, groupController.RemoveMemberFromGroup);

// Delete a group (creator only)
routes.delete('/groups/:groupId', verifyAccessToken, groupController.DeleteGroup);

module.exports = routes;

