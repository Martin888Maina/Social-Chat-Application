const mongoose    = require('mongoose');
const Message     = require('../models/messageModel');
const createError = require('http-errors');

module.exports = {

            SaveMessage: async (req, res, next) => {
                const { sender, receiver, content, clientId } = req.body;

                if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
                    return next(createError(400, 'Invalid sender or receiver ID'));
                }

                try {
                    // upsert on clientId so retries return the same saved record
                    if (clientId) {
                        const doc = await Message.findOneAndUpdate(
                            { clientId },
                            { $setOnInsert: { sender, receiver, content, clientId } },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                        return res.status(201).json(doc);
                    }

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
                        content: { $regex: query, $options: 'i' }
                    }).sort({ timestamp: 1 });

                    res.status(200).json(messages);
                } catch (error) {
                    console.error('Error searching messages:', error.message);
                    next(createError(500, 'Failed to search messages'));
                }
            },

            // mark all unread messages from a sender to the logged-in user as read
            MarkAsRead: async (req, res, next) => {
                const { senderId } = req.params;
                const receiverId   = req.payload.aud;

                if (!mongoose.Types.ObjectId.isValid(senderId)) {
                    return next(createError(400, 'Invalid sender ID'));
                }

                try {
                    await Message.updateMany(
                        { sender: senderId, receiver: receiverId, isRead: false },
                        { $set: { isRead: true } }
                    );
                    res.status(200).json({ success: true });
                } catch (error) {
                    next(createError(500, 'Failed to mark messages as read'));
                }
            },

            // unread counts grouped by sender — used to hydrate badges on load
            GetUnreadCounts: async (req, res, next) => {
                const userId = req.payload.aud;

                try {
                    const counts = await Message.aggregate([
                        { $match: { receiver: new mongoose.Types.ObjectId(userId), isRead: false } },
                        { $group: { _id: '$sender', count: { $sum: 1 } } }
                    ]);

                    const result = {};
                    counts.forEach(({ _id, count }) => { result[_id.toString()] = count; });

                    res.status(200).json(result);
                } catch (error) {
                    next(createError(500, 'Failed to fetch unread counts'));
                }
            },

            // one entry per unique contact with lastMessage, timestamp, and unread count
            GetConversations: async (req, res, next) => {
                const userId = req.payload.aud;

                try {
                    const messages = await Message.aggregate([
                        {
                            $match: {
                                $or: [
                                    { sender: new mongoose.Types.ObjectId(userId) },
                                    { receiver: new mongoose.Types.ObjectId(userId) }
                                ]
                            }
                        },
                        { $sort: { timestamp: -1 } },
                        {
                            $group: {
                                _id: {
                                    $cond: [
                                        { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
                                        '$receiver',
                                        '$sender'
                                    ]
                                },
                                lastMessage:   { $first: '$content' },
                                lastTimestamp: { $first: '$timestamp' },
                                unread: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                                                    { $eq: ['$isRead', false] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        { $sort: { lastTimestamp: -1 } }
                    ]);

                    const Register = require('../models/registerModel');
                    const populated = await Promise.all(
                        messages.map(async (conv) => {
                            const contact = await Register.findById(conv._id, 'firstname lastname profilePicture');
                            return {
                                contactId:      conv._id.toString(),
                                contactName:    contact ? `${contact.firstname} ${contact.lastname}` : 'Unknown',
                                profilePicture: contact?.profilePicture || '',
                                lastMessage:    conv.lastMessage,
                                lastTimestamp:  conv.lastTimestamp,
                                unread:         conv.unread,
                            };
                        })
                    );

                    res.status(200).json(populated);
                } catch (error) {
                    console.error('Error fetching conversations:', error.message);
                    next(createError(500, 'Failed to fetch conversations'));
                }
            }

}
