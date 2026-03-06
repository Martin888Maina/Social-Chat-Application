import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../utils/socketManager';
import { formatMessageTime } from '../../utils/formatDate';
import '../styling/UserChat.css';

const UserChat = () => {
    const history = useHistory();
    const socket  = getSocket();

    const [message, setMessage]             = useState('');
    const [messages, setMessages]           = useState([]);
    const [username, setUsername]           = useState('');
    const [users, setUsers]                 = useState([]);
    const [isTyping, setIsTyping]           = useState(false);
    const [userId, setUserId]               = useState('');
    const [receiverId, setReceiverId]       = useState('');
    const [searchQuery, setSearchQuery]     = useState('');
    const [profileData, setProfileData]     = useState(null);
    const [receiverName, setReceiverName]   = useState('');
    const [notifications, setNotifications] = useState([]);

    const messageEndRef    = useRef(null);
    const typingTimeoutRef = useRef(null);

    // fetch current user info and full user list on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userResponse  = await api.get('/Register/user');
                const { _id, firstname, lastname, profilePicture } = userResponse.data;

                setUsername(firstname);
                setUserId(_id);
                setProfileData({ firstname, lastname, profilePicture });

                socket.emit('new user', _id, firstname);

                const usersResponse = await api.get('/Register/users');
                setUsers(usersResponse.data);
            } catch (error) {
                console.error('failed to load user data:', error);
            }
        };

        fetchUserData();

        socket.on('chat message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        socket.on('update users', (userList) => {
            setUsers(userList);
        });

        socket.on('typing', (data) => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setIsTyping(data.isTyping);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        });

        socket.on('notification', (notification) => {
            setNotifications((prev) => [...prev, notification]);
        });

        return () => {
            socket.off('chat message');
            socket.off('update users');
            socket.off('typing');
            socket.off('notification');
        };
    }, []);

    // load conversation history when receiver changes
    useEffect(() => {
        if (!receiverId || !userId) return;
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/Message/messages/${userId}/${receiverId}`);
                setMessages(response.data);
            } catch (error) {
                console.error('failed to fetch messages:', error);
            }
        };
        fetchMessages();
    }, [receiverId, userId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !userId || !receiverId) return;

        const messageData = {
            sender:    userId,
            receiver:  receiverId,
            content:   message,
            timestamp: new Date().toISOString(),
        };

        try {
            await api.post('/Message/saveMessage', messageData);
            socket.emit('chat message', messageData);
            setMessage('');
        } catch (error) {
            console.error('failed to send message:', error);
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        socket.emit('typing', { isTyping: e.target.value.length > 0, nick: username });
    };

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        socket.emit('logout', username);
        history.push('/login');
    };

    const handleReceiverSelection = async (selectedOption) => {
        const name = selectedOption?.label;
        if (!name) return;
        try {
            const response = await api.get('/Register/userIdByUsername', { params: { username: name } });
            setReceiverId(response.data.userId);
            setReceiverName(name);
        } catch (error) {
            console.error('failed to fetch receiver id:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !receiverId) return;
        try {
            const response = await api.get(`/Message/search/${userId}/${receiverId}`, {
                params: { query: searchQuery },
            });
            setMessages(response.data);
        } catch (error) {
            console.error('message search failed:', error);
        }
    };

    const userOptions = users.map((user) => ({
        value: user._id,
        label: user.firstname,
    }));

    if (!profileData) return <div>Loading...</div>;

    return (
        <div className="chat-container">
            <div className="user-profile-section">
                {profileData.profilePicture ? (
                    <img src={profileData.profilePicture} alt="Profile" className="profile-image-large" />
                ) : (
                    <p>No profile picture available</p>
                )}
                <h3>{profileData.firstname} {profileData.lastname}</h3>
            </div>

            <div className="chat-actions">
                <button onClick={() => history.push('/dashboard')} className="btn btn-outline-secondary profile-btn">Home</button>
                <button onClick={() => history.push('/profile')} className="btn btn-info profile-btn">Profile</button>
                <button onClick={() => history.push('/groups')} className="btn btn-secondary group-btn">Groups</button>
                <button onClick={handleLogout} className="btn btn-danger logout-btn">Logout</button>
            </div>

            <div className="users-list">
                <h5>Select a User to Chat:</h5>
                <Select
                    options={userOptions}
                    onChange={handleReceiverSelection}
                    placeholder="Search for users..."
                    classNamePrefix="react-select"
                />
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </div>

            <div className="message-list">
                {messages.map((msg, index) => {
                    const { date, time } = formatMessageTime(msg.timestamp);
                    return (
                        <div key={index} className={`message-item ${msg.sender === userId ? 'sent' : 'received'}`}>
                            <div className="message-content">
                                <strong>{msg.sender === userId ? 'You' : receiverName}:</strong> {msg.content}
                                <div className="message-info">
                                    <span className="date">{date}</span>
                                    <span className="time">{time}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messageEndRef} />
            </div>

            <div className="notifications">
                {notifications.map((notification, index) => (
                    <div key={index} className="notification">{notification.content}</div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="message-form mt-3">
                <input
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="form-control"
                />
                <button type="submit" className="btn btn-primary ml-2">Send</button>
            </form>

            {isTyping && <div className="fallback"><p>Someone is typing...</p></div>}
        </div>
    );
};

export default UserChat;
