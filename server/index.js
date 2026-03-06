const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const messageRoutes = require('./routes/messageRoutes');
const registerRoutes = require('./routes/registerRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const groupRoutes = require('./routes/groupRoutes');
const app = express();
const server = http.createServer(app);
const Register = require('./models/registerModel');// importing the model
const Group = require('./models/groupModel');


app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
}));

require('dotenv').config();
require('./config/init_mongodb');

app.use(express.json());

// Middleware to attach io instance to req object
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/Register', registerRoutes);
app.use('/Message', messageRoutes);
app.use('/Password', passwordRoutes);
app.use('/Group', groupRoutes);

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const onlineUsers = new Map();
const userSocketMap = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Register new user and map their user ID to their socket ID
    socket.on('new user', (userId, username) => {
        userSocketMap.set(userId, socket.id); // Store userId to socketId mapping
        onlineUsers.set(username, socket.id); // Keep the existing mapping of username to socketId
        io.emit('update users', Array.from(onlineUsers.keys()));
        console.log('User registered:', username, 'User ID:', userId, 'Socket ID:', socket.id);
    });

    // Join group room
    socket.on('join group', (groupId) => {
        socket.join(groupId);
        console.log(`User ${socket.id} joined group ${groupId}`);
    });

    // Leave group room
    socket.on('leave group', (groupId) => {
        socket.leave(groupId);
        console.log(`User ${socket.id} left group ${groupId}`);
    });

    

    // Handle group messages and emit to all users in the group
    socket.on('group message', async (msg) => {
        try {
            console.log('Group message received on server:', msg);

            // Fetch sender details
            const sender = await Register.findById(msg.sender, 'firstname lastname');
            if (!sender) {
                console.error('Sender not found:', msg.sender);
                return;
            }
            const senderName = `${sender.firstname} ${sender.lastname}`;

            // Fetch group details
            const group = await Group.findById(msg.groupId, 'name');
            if (!group) {
                console.error('Group not found:', msg.groupId);
                return;
            }
            const groupName = group.name;

            // Emit group message to all users in the group
            io.to(msg.groupId).emit('group message', msg);

            // Notify all users in the group
            io.to(msg.groupId).emit('notification', {
                type: 'group',
                content: `${senderName} sent a message in ${groupName}`
            });
        } catch (error) {
            console.error('Error handling group message:', error);
        }
    });

    // In the 'chat message' event handler
    socket.on('chat message', async (msg) => {
        console.log('Message received on server:', msg);

        const recipientSocketId = userSocketMap.get(msg.receiver);
        if (!recipientSocketId) {
            console.error('Recipient socket ID not found for:', msg.receiver);
        } else {
            io.to(recipientSocketId).emit('chat message', msg);
            // Fetch sender details for notification
            const sender = await Register.findById(msg.sender, 'firstname lastname');
            if (!sender) {
                console.error('Sender not found:', msg.sender);
                return;
            }
            const senderName = `${sender.firstname} ${sender.lastname}`;
            io.to(recipientSocketId).emit('notification', {
                type: 'private',
                content: `New message from ${senderName}`
            });
        }

        const senderSocketId = userSocketMap.get(msg.sender);
        if (senderSocketId) {
            io.to(senderSocketId).emit('chat message', msg);
        } else {
            console.error('Sender socket ID not found for:', msg.sender);
        }
    });

    // Broadcast typing status to other users
    socket.on('typing', (data) => {
        const { recipientId } = data;
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('typing', data);
        }
    });

    // Handle user logout
    socket.on('logout', (username) => {
        onlineUsers.delete(username);
        io.emit('update users', Array.from(onlineUsers.keys()));
        console.log('User logged out:', username);
    });

    socket.on('disconnect', () => {
        // Remove the user ID to socket ID mapping on disconnect
        const disconnectedUser = Array.from(userSocketMap.entries()).find(([userId, id]) => id === socket.id);
        if (disconnectedUser) {
            const [userId] = disconnectedUser;
            userSocketMap.delete(userId);
            onlineUsers.delete(userId); // Remove from onlineUsers if needed
            io.emit('update users', Array.from(onlineUsers.keys()));
            console.log('User disconnected:', userId);
        }
    });
});

app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    });
});

server.listen(process.env.PORT || 4000, function() {
    console.log('Now listening for requests on: http://localhost:4000');
});


