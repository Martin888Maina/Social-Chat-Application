require('dotenv').config();
require('./config/init_mongodb');

const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const path       = require('path');
const socketIo   = require('socket.io');
const mongoose   = require('mongoose');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const messageRoutes  = require('./routes/messageRoutes');
const registerRoutes = require('./routes/registerRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const groupRoutes    = require('./routes/groupRoutes');
const errorHandler   = require('./middleware/errorHandler');

const Register = require('./models/registerModel');
const Group    = require('./models/groupModel');

const app    = express();
const server = http.createServer(app);

// security headers
app.use(helmet());

// serve uploaded profile pictures as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

app.use(express.json());

// rate limiter for auth endpoints — relaxed for development/testing
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { error: { status: 429, message: 'Too many requests, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
});

// limiter for message sending — relaxed for development/testing
const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300,
    message: { error: { status: 429, message: 'Sending too fast, slow down.' } },
    standardHeaders: true,
    legacyHeaders: false,
});

const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket'],
});

// attach io to every request so controllers can emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/Register', authLimiter, registerRoutes);
app.use('/Message', messageLimiter, messageRoutes);
app.use('/Password', authLimiter, passwordRoutes);
app.use('/Group', groupRoutes);

// onlineUsers  — username  -> socketId
// userSocketMap — userId   -> { socketId, username }
// keeping both pieces together so disconnect can clean up correctly
const onlineUsers   = new Map();
const userSocketMap = new Map();

io.on('connection', (socket) => {
    console.log('user connected:', socket.id);

    socket.on('new user', (userId, username) => {
        // store username alongside socketId so disconnect can find the right key
        userSocketMap.set(userId, { socketId: socket.id, username });
        onlineUsers.set(username, socket.id);
        io.emit('update users', Array.from(onlineUsers.keys()));
    });

    socket.on('join group', (groupId) => {
        socket.join(groupId);
    });

    socket.on('leave group', (groupId) => {
        socket.leave(groupId);
    });

    socket.on('group message', async (msg) => {
        try {
            const sender = await Register.findById(msg.sender, 'firstname lastname');
            if (!sender) return;
            const senderName = `${sender.firstname} ${sender.lastname}`;

            const group = await Group.findById(msg.groupId, 'name');
            if (!group) return;

            io.to(msg.groupId).emit('group message', msg);
            io.to(msg.groupId).emit('notification', {
                type: 'group',
                content: `${senderName} sent a message in ${group.name}`,
            });
        } catch (error) {
            console.error('group message error:', error.message);
        }
    });

    socket.on('chat message', async (msg) => {
        const recipient = userSocketMap.get(msg.receiver);
        if (recipient) {
            io.to(recipient.socketId).emit('chat message', msg);
            try {
                const sender = await Register.findById(msg.sender, 'firstname lastname');
                if (sender) {
                    io.to(recipient.socketId).emit('notification', {
                        type: 'private',
                        content: `New message from ${sender.firstname} ${sender.lastname}`,
                    });
                }
            } catch (err) {
                console.error('notification error:', err.message);
            }
        }

        // echo back to sender's own socket too
        const senderEntry = userSocketMap.get(msg.sender);
        if (senderEntry) {
            io.to(senderEntry.socketId).emit('chat message', msg);
        }
    });

    socket.on('typing', (data) => {
        const recipient = userSocketMap.get(data.recipientId);
        if (recipient) {
            io.to(recipient.socketId).emit('typing', data);
        }
    });

    // broadcast typing status to everyone else in the group room
    socket.on('group typing', (data) => {
        socket.to(data.groupId).emit('group typing', data);
    });

    socket.on('logout', (username) => {
        onlineUsers.delete(username);
        io.emit('update users', Array.from(onlineUsers.keys()));
    });

    socket.on('disconnect', () => {
        // find the user who owned this socket and remove them from both maps
        const entry = Array.from(userSocketMap.entries()).find(
            ([, val]) => val.socketId === socket.id
        );
        if (entry) {
            const [userId, { username }] = entry;
            userSocketMap.delete(userId);
            onlineUsers.delete(username); // use username key — was using userId before (bug)
            io.emit('update users', Array.from(onlineUsers.keys()));
        }
    });
});

// 404 for unmatched routes
app.use((req, res, next) => {
    const err    = new Error('Not Found');
    err.status   = 404;
    next(err);
});

app.use(errorHandler);

server.listen(process.env.PORT || 4000, () => {
    console.log('server running on http://localhost:4000');
});
