import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Swal from 'sweetalert2';
import Select from 'react-select';
import api from '../../services/api';
import { getSocket } from '../../utils/socketManager';
import { formatMessageTime } from '../../utils/formatDate';
import '../styling/GroupChat.css';

const GroupChat = () => {
    const history = useHistory();
    const socket  = getSocket();

    const [message, setMessage]           = useState('');
    const [messages, setMessages]         = useState([]);
    const [groups, setGroups]             = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [userId, setUserId]             = useState('');
    const [users, setUsers]               = useState({});
    const [availableUsers, setAvailableUsers] = useState([]);
    const [newMemberId, setNewMemberId]   = useState('');
    const messageEndRef = useRef(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userIdResponse = await api.get('/Register/userById');
                setUserId(userIdResponse.data.userId);

                const usersResponse = await api.get('/Register/users');
                const usersDict = usersResponse.data.reduce((acc, user) => {
                    acc[user._id] = user.firstname;
                    return acc;
                }, {});
                setUsers(usersDict);
                setAvailableUsers(usersResponse.data);
            } catch (error) {
                console.error('failed to load initial data:', error);
            }
        };

        fetchInitialData();

        // deduplicate incoming group messages by _id
        socket.on('group message', (msg) => {
            setMessages((prev) => {
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        socket.on('notification', (notification) => {
            const title = notification.type === 'group' ? 'New Group Message' : 'New Private Message';
            Swal.fire({ icon: 'info', title, text: notification.content, confirmButtonText: 'OK' });
        });

        return () => {
            socket.off('group message');
            socket.off('notification');
        };
    }, []);

    useEffect(() => {
        if (!userId) return;
        const fetchGroups = async () => {
            try {
                const response = await api.get(`/Group/users/${userId}/groups`);
                setGroups(response.data);
            } catch (error) {
                console.error('failed to fetch groups:', error);
            }
        };
        fetchGroups();
    }, [userId]);

    useEffect(() => {
        if (!selectedGroup) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/Group/groups/${selectedGroup}/messages`);
                setMessages(response.data);
            } catch (error) {
                console.error('failed to fetch group messages:', error);
            }
        };

        fetchMessages();
        socket.emit('join group', selectedGroup);

        return () => {
            socket.emit('leave group', selectedGroup);
        };
    }, [selectedGroup]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedGroup) return;

        const messageData = {
            groupId:   selectedGroup,
            sender:    userId,
            content:   message,
            timestamp: new Date().toISOString(),
        };

        try {
            const response = await api.post(`/Group/groups/${selectedGroup}/messages`, messageData);
            socket.emit('group message', { ...messageData, _id: response.data._id });
            setMessage('');
        } catch (error) {
            console.error('failed to send group message:', error);
        }
    };

    const handleAddMember = async () => {
        if (!selectedGroup || !newMemberId) return;
        try {
            await api.post(`/Group/groups/${selectedGroup}/members`, { userId: newMemberId });
            Swal.fire({ icon: 'success', title: 'Member Added', text: 'Member added successfully!', confirmButtonText: 'OK' });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not add the member. Please try again.', confirmButtonText: 'OK' });
            console.error('failed to add member:', error);
        }
    };

    const userOptions = availableUsers.map((user) => ({
        value: user._id,
        label: `${user.firstname} ${user.lastname}`,
    }));

    return (
        <div className="chat-container">
            <div className="group-chat-header">
                <button onClick={() => history.push('/dashboard')} className="btn btn-outline-secondary">Home</button>
                <button onClick={() => history.push('/create-group')} className="btn btn-primary create-group-btn">
                    Create New Group
                </button>
            </div>

            <div className="group-list">
                <h2>Groups</h2>
                {groups.map((group) => (
                    <button
                        key={group._id}
                        onClick={() => setSelectedGroup(group._id)}
                        className="btn btn-secondary group-btn"
                    >
                        {group.name}
                    </button>
                ))}
            </div>

            {selectedGroup && (
                <div className="add-member-container">
                    <h3>Add New Member</h3>
                    <Select
                        value={userOptions.find((opt) => opt.value === newMemberId) || null}
                        onChange={(opt) => setNewMemberId(opt ? opt.value : '')}
                        options={userOptions}
                        placeholder="Select a member"
                        isClearable
                    />
                    <button onClick={handleAddMember} className="btn btn-primary mt-2">Add Member</button>
                </div>
            )}

            <div className="chat-section">
                <h2>Chat</h2>
                <div className="message-list">
                    {messages.map((msg, index) => {
                        const { date, time } = formatMessageTime(msg.timestamp);
                        return (
                            <div key={index} className={`message-item ${msg.sender === userId ? 'user-message' : 'group-message'}`}>
                                <div className="message-content">
                                    <strong>{msg.sender === userId ? 'You' : users[msg.sender] || 'Anonymous'}:</strong>
                                    {msg.content}
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

                <form onSubmit={handleSubmit} className="message-form mt-3">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="form-control"
                    />
                    <button type="submit" className="btn btn-primary ml-2">Send</button>
                </form>
            </div>

            <button onClick={() => history.push('/chat')} className="btn btn-info mt-3 go-to-user-chat">
                Go to Private Chat
            </button>
        </div>
    );
};

export default GroupChat;
