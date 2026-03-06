//This schema is used to store messages on groups.
//odel defines the structure for the Conversation collection in MongoDB, which stores the messages sent within a group, including the group ID, sender, content, and timestamp.

const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const conversationSchema = new Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
