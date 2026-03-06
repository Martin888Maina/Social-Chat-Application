const mongoose = require('mongoose');
const Group = require('../models/groupModel');  // Importing Group model
const Conversation = require('../models/conversationModel');  // Importing Conversation model
const createError = require('http-errors');

module.exports = {
    CreateGroup: async (req, res, next) => {
        const { name, members } = req.body;

        try {
            const newGroup = new Group({ name, members });
            const result = await newGroup.save();
            res.status(201).json(result);
        } catch (error) {
            console.error('Error creating group:', error.message);
            next(createError(500, 'Failed to create group'));
        }
    },

    AddMemberToGroup: async (req, res, next) => {
        const groupId = req.params.groupId;
        const { userId } = req.body;
    
        console.log('Group ID:', groupId);
        console.log('User ID:', userId);
    
        try {
            const group = await Group.findById(groupId);
            if (!group) {
                return next(createError(404, 'Group not found'));
            }
    
            if (group.members.includes(userId)) {
                return next(createError(400, 'User is already a member of the group'));
            }
    
            group.members.push(userId);
            await group.save();
            res.status(200).json(group);
        } catch (error) {
            console.error('Error adding member:', error.message);
            next(createError(500, 'Failed to add member to group'));
        }
    },
    

    GetUserGroups: async (req, res, next) => {
        const { userId } = req.params;

        try {
            const groups = await Group.find({ members: userId });
            res.status(200).json(groups);
        } catch (error) {
            console.error('Error fetching groups:', error.message);
            next(createError(500, 'Failed to fetch groups'));
        }
    },

    SendMessageToGroup: async (req, res, next) => {
        const { groupId, sender, content } = req.body;

         // Validate that groupId and sender are valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(sender)) {
            return next(createError(400, 'Invalid group ID or sender ID'));
        }

        try {
            // Create a new message in the group
            const newMessage = new Conversation({ groupId, sender, content });
            const result = await newMessage.save();
    
            // Emit the message via Socket.io
            req.io.to(groupId).emit('group message', result);
    
            res.status(201).json(result);
        } catch (error) {
            console.error('Error saving group message:', error.message);
            next(createError(500, 'Failed to send message'));
        }
    },

    GetGroupMessages: async (req, res, next) => {
        const { groupId } = req.params;

        try {
            // Fetch messages for the specified group, sorted by timestamp
            const messages = await Conversation.find({ groupId }).sort({ createdAt: 1 });
            res.status(200).json(messages);
        } catch (error) {
            console.error('Error fetching group messages:', error.message);
            next(createError(500, 'Failed to fetch group messages'));
        }
    }
}
