//This model will store information about the groups.
//which stores information about the groups, including the name and members.

const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Register'
    }]
}, {
    timestamps: true
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
