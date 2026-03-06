const mongoose    = require('mongoose');
const Message     = require('../models/messageModel');
const createError = require('http-errors');

module.exports = {

            SaveMessage: async (req, res, next) => {
                const { sender, receiver, content } = req.body;

                // Validate sender and receiver are valid ObjectId
                if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
                    return next(createError(400, 'Invalid sender or receiver ID'));
                }

                try {
                    const newMessage = new Message({ sender, receiver, content });
                    const result = await newMessage.save();
                    res.status(201).json(result);
                } catch (error) {
                    console.error('Error saving message:', error.message);
                    next(createError(500, 'Failed to send message'));
                }
            },

            AddMessage: async (req, res, next) => {
                try {
                    const message = new Message(req.body);
                    const result  = await message.save();
                    res.send(result);
                } catch (error) {
                    if (error.name === 'ValidationError') {
                        next(createError(422, error.message));
                        return;
                    }
                    next(error);
                }
            },

            GetAllMessage: async (req, res, next) => {
                try {
                    const result = await Message.find({});
                    res.send(result);
                } catch (error) {
                    next(error);
                }
            },

            GetMessage: async (req, res, next) => {
                const _id = req.params._id;
                try {
                    if (!mongoose.Types.ObjectId.isValid(_id)) {
                        throw createError(400, 'Invalid message id');
                    }
                    const result = await Message.findById(_id);
                    if (!result) {
                        throw createError(404, 'Message does not exist');
                    }
                    res.send(result);
                } catch (error) {
                    if (error instanceof mongoose.CastError) {
                        next(createError(400, 'Invalid message id'));
                        return;
                    }
                    next(error);
                }
            },

            // was referencing undefined Student variable — fixed to use Message
            ChangeMessage: async (req, res, next) => {
                const _id = req.params._id;
                try {
                    if (!mongoose.Types.ObjectId.isValid(_id)) {
                        throw createError(400, 'Invalid message id');
                    }
                    const update  = req.body;
                    const options = { new: true };
                    const result  = await Message.findByIdAndUpdate(_id, update, options);
                    if (!result) {
                        throw createError(404, 'Message does not exist');
                    }
                    res.send(result);
                } catch (error) {
                    if (error instanceof mongoose.CastError) {
                        next(createError(400, 'Invalid message id'));
                        return;
                    }
                    next(error);
                }
            },

            EraseMessage: async (req, res, next) => {
                const _id = req.params._id;
                try {
                    if (!mongoose.Types.ObjectId.isValid(_id)) {
                        throw createError(400, 'Invalid message id');
                    }
                    const result = await Message.findByIdAndDelete(_id);
                    if (!result) {
                        throw createError(404, 'Message does not exist');
                    }
                    res.send(result);
                } catch (error) {
                    if (error instanceof mongoose.CastError) {
                        next(createError(400, 'Invalid message id'));
                        return;
                    }
                    next(error);
                }
            },

            GetMessagesBetweenUsers: async (req, res, next) => {
                const { senderId, receiverId } = req.params;

                // Check if IDs are valid
                if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
                    return next(createError(400, 'Invalid sender or receiver ID'));
                }
                    
                try {
                    const messages = await Message.find({
                        $or: [
                            { sender: senderId, receiver: receiverId },
                            { sender: receiverId, receiver: senderId }
                        ]
                    }).sort({ timestamp: 1 }); // Sort messages by timestamp
        
                    res.status(200).json(messages);
                } catch (error) {
                    console.error('Error fetching messages:', error.message);
                    next(createError(500, 'Failed to fetch messages'));
                }
            },

            SearchMessages: async (req, res, next) => {
                const { userId, receiverId } = req.params;
                const { query } = req.query;
        
                try {
                    const messages = await Message.find({
                        $or: [
                            { sender: userId, receiver: receiverId },
                            { sender: receiverId, receiver: userId }
                        ],
                        content: { $regex: query, $options: 'i' } // Case-insensitive search
                    }).sort({ timestamp: 1 });
        
                    res.status(200).json(messages);
                } catch (error) {
                    console.error('Error searching messages:', error.message);
                    next(createError(500, 'Failed to search messages'));
                }
            }

}
