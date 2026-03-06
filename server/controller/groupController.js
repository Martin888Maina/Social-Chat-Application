const mongoose = require('mongoose');
const Group = require('../models/groupModel');
const Conversation = require('../models/conversationModel');
const createError = require('http-errors');

module.exports = {
    CreateGroup: async (req, res, next) => {
        const { name, members } = req.body;

        try {
            const newGroup = new Group({ name, members });
            const result = await newGroup.save();
            res.status(201).json(result);
        } catch (error) {
            next(createError(500, 'Failed to create group'));
        }
    },

    AddMemberToGroup: async (req, res, next) => {
        const groupId = req.params.groupId;
        const { userId } = req.body;
    
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
            next(createError(500, 'Failed to add member to group'));
        }
    },
    

    GetUserGroups: async (req, res, next) => {
        const { userId } = req.params;

        try {
            const groups = await Group.find({ members: userId });
            res.status(200).json(groups);
        } catch (error) {
            next(createError(500, 'Failed to fetch groups'));
        }
    },

    SendMessageToGroup: async (req, res, next) => {
        const { groupId, sender, content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(sender)) {
            return next(createError(400, 'Invalid group ID or sender ID'));
        }

        try {
            const newMessage = new Conversation({ groupId, sender, content });
            const result = await newMessage.save();
            req.io.to(groupId).emit('group message', result);
            res.status(201).json(result);
        } catch (error) {
            next(createError(500, 'Failed to send message'));
        }
    },

    GetGroupMessages: async (req, res, next) => {
        const { groupId } = req.params;

        try {
            const messages = await Conversation.find({ groupId }).sort({ createdAt: 1 });
            res.status(200).json(messages);
        } catch (error) {
            next(createError(500, 'Failed to fetch group messages'));
        }
    },

    GetGroupMembers: async (req, res, next) => {
        const { groupId } = req.params;

        try {
            const group = await Group.findById(groupId).populate('members', 'firstname lastname email profilePicture');
            if (!group) return next(createError(404, 'Group not found'));

            res.status(200).json({ groupId: group._id, name: group.name, creator: group.creator, members: group.members });
        } catch (error) {
            next(createError(500, 'Failed to fetch group members'));
        }
    },

    RemoveMemberFromGroup: async (req, res, next) => {
        const { groupId, userId } = req.params;
        const requestingUserId = req.payload.aud;

        try {
            const group = await Group.findById(groupId);
            if (!group) return next(createError(404, 'Group not found'));

            // only the group creator can remove members
            if (group.creator && group.creator.toString() !== requestingUserId) {
                return next(createError(403, 'Only the group creator can remove members'));
            }

            group.members = group.members.filter((m) => m.toString() !== userId);
            await group.save();

            res.status(200).json({ message: 'Member removed', group });
        } catch (error) {
            next(createError(500, 'Failed to remove member'));
        }
    },

    DeleteGroup: async (req, res, next) => {
        const { groupId } = req.params;
        const requestingUserId = req.payload.aud;

        try {
            const group = await Group.findById(groupId);
            if (!group) return next(createError(404, 'Group not found'));

            // only the creator can delete the group
            if (group.creator && group.creator.toString() !== requestingUserId) {
                return next(createError(403, 'Only the group creator can delete this group'));
            }

            await Group.findByIdAndDelete(groupId);
            // clean up all messages that belonged to this group
            await Conversation.deleteMany({ groupId });

            res.status(200).json({ message: 'Group deleted successfully' });
        } catch (error) {
            next(createError(500, 'Failed to delete group'));
        }
    }
}
