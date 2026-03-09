import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Swal from 'sweetalert2';
import Select from 'react-select';
import EmojiPicker from 'emoji-picker-react';
import api from '../../services/api';
import { getSocket } from '../../utils/socketManager';
import { formatMessageTime } from '../../utils/formatDate';
import '../styling/GroupChat.css';

const GroupChat = () => {
    const history = useHistory();
    const socket  = getSocket();

    const [message, setMessage]               = useState('');
    const [messages, setMessages]             = useState([]);
    const [groups, setGroups]                 = useState([]);
    const [selectedGroup, setSelectedGroup]   = useState(null);
    const [userId, setUserId]                 = useState('');
    const [profileData, setProfileData]       = useState(null);
    const [users, setUsers]                   = useState({});
    const [availableUsers, setAvailableUsers] = useState([]);
    const [newMemberId, setNewMemberId]       = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAddMember, setShowAddMember]   = useState(false);
    const [isTyping, setIsTyping]             = useState(false);
    const [typingName, setTypingName]         = useState('');
    const [isSending, setIsSending]           = useState(false);

    // last message preview per group: { groupId: text }
    const [groupPreviews, setGroupPreviews]   = useState({});
    // unread per group: { groupId: count }
    const [groupUnread, setGroupUnread]       = useState({});

    const messageEndRef    = useRef(null);
    const emojiPickerRef   = useRef(null);
    const inputRef         = useRef(null);
    const addMemberRef     = useRef(null);
    const selectedGroupRef = useRef(null);
    const typingTimeout    = useRef(null);

    useEffect(() => {
        selectedGroupRef.current = selectedGroup;
    }, [selectedGroup]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // get full profile so we can show the user's name/avatar in the sidebar
                const profileRes = await api.get('/Register/user');
                const { _id, firstname, lastname, profilePicture } = profileRes.data;
                setUserId(_id);
                setProfileData({ firstname, lastname, profilePicture });
                socket.emit('new user', _id, firstname);

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

        socket.on('group message', (msg) => {
            const openGroup = selectedGroupRef.current;

            if (msg.groupId === openGroup) {
                setMessages((prev) => {
                    // dedup by _id or clientId to handle retries and socket echoes
                    if (msg._id      && prev.some((m) => m._id      === msg._id))      return prev;
                    if (msg.clientId && prev.some((m) => m.clientId === msg.clientId)) return prev;
                    return [...prev, msg];
                });
                // clear typing indicator when a message arrives
                setIsTyping(false);
            } else {
                // bump badge for groups not currently open
                setGroupUnread((prev) => ({
                    ...prev,
                    [msg.groupId]: (prev[msg.groupId] || 0) + 1,
                }));
            }

            // always update the preview for the group that received the message
            setGroupPreviews((prev) => ({
                ...prev,
                [msg.groupId]: msg.content,
            }));
        });

        socket.on('group typing', (data) => {
            // only show if it's for the currently open group
            if (data.groupId !== selectedGroupRef.current) return;
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            setTypingName(data.nick || 'Someone');
            setIsTyping(data.isTyping);
            if (data.isTyping) {
                typingTimeout.current = setTimeout(() => setIsTyping(false), 3000);
            }
        });

        return () => {
            socket.off('group message');
            socket.off('group typing');
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
                // seed the preview with the last message in history
                if (response.data.length > 0) {
                    const last = response.data[response.data.length - 1];
                    setGroupPreviews((prev) => ({ ...prev, [selectedGroup]: last.content }));
                }
            } catch (error) {
                console.error('failed to fetch group messages:', error);
            }
        };
        fetchMessages();
        socket.emit('join group', selectedGroup);

        // clear badge when switching to this group
        setGroupUnread((prev) => {
            const updated = { ...prev };
            delete updated[selectedGroup];
            return updated;
        });

        setShowAddMember(false);

        return () => {
            socket.emit('leave group', selectedGroup);
        };
    }, [selectedGroup]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // close emoji picker and add-member panel on outside click
    useEffect(() => {
        const handler = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            if (addMemberRef.current && !addMemberRef.current.contains(e.target)) {
                setShowAddMember(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedGroup || isSending) return;

        const clientId    = crypto.randomUUID();
        const messageData = {
            groupId:   selectedGroup,
            sender:    userId,
            content:   message,
            timestamp: new Date().toISOString(),
            clientId,
        };

        setIsSending(true);
        try {
            const response = await api.post(`/Group/groups/${selectedGroup}/messages`, messageData);
            socket.emit('group message', { ...messageData, _id: response.data._id });
            socket.emit('group typing', { isTyping: false, nick: profileData?.firstname, groupId: selectedGroup });
            setMessage('');
            setShowEmojiPicker(false);
            setGroupPreviews((prev) => ({ ...prev, [selectedGroup]: message }));
        } catch (error) {
            console.error('failed to send group message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (!selectedGroup) return;
        socket.emit('group typing', {
            isTyping:  e.target.value.length > 0,
            nick:      profileData?.firstname || 'Someone',
            groupId:   selectedGroup,
        });
    };

    const handleAddMember = async () => {
        if (!selectedGroup || !newMemberId) return;
        try {
            await api.post(`/Group/groups/${selectedGroup}/members`, { userId: newMemberId });
            setNewMemberId('');
            setShowAddMember(false);
            Swal.fire({ icon: 'success', title: 'Member Added', text: 'Member added successfully!', confirmButtonText: 'OK' });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not add the member. Please try again.', confirmButtonText: 'OK' });
            console.error('failed to add member:', error);
        }
    };

    const selectedGroupName = groups.find((g) => g._id === selectedGroup)?.name;

    const userOptions = availableUsers.map((user) => ({
        value: user._id,
        label: `${user.firstname} ${user.lastname}`,
    }));

    return (
        <div className="group-chat-page">
            {/* sidebar */}
            <aside className="group-sidebar">

                {/* logged-in user profile — mirrors UserChat sidebar */}
                {profileData && (
                    <div className="sidebar-profile">
                        {profileData.profilePicture ? (
                            <img src={profileData.profilePicture} alt="Profile" className="profile-image-large" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {profileData.firstname?.[0]}{profileData.lastname?.[0]}
                            </div>
                        )}
                        <h3 className="sidebar-username">{profileData.firstname} {profileData.lastname}</h3>
                    </div>
                )}

                {/* navigation — mirrors UserChat */}
                <nav className="sidebar-nav">
                    <button onClick={() => history.push('/dashboard')} className="sidebar-nav-btn">Home</button>
                    <button onClick={() => history.push('/chat')}      className="sidebar-nav-btn">Private Chat</button>
                    <button onClick={() => history.push('/profile')}   className="sidebar-nav-btn">Profile</button>
                </nav>

                {/* group list header */}
                <div className="group-sidebar-header">
                    <span className="select-label">Groups</span>
                    <button onClick={() => history.push('/create-group')} className="create-group-btn">
                        + New
                    </button>
                </div>

                {/* add member panel — shown inline when a group is open */}
                {selectedGroup && (
                    <div className="add-member-inline" ref={addMemberRef}>
                        <button
                            className="add-member-toggle"
                            onClick={() => setShowAddMember((prev) => !prev)}
                        >
                            {showAddMember ? '✕ Cancel' : '+ Add Member'}
                        </button>
                        {showAddMember && (
                            <div className="add-member-form">
                                <Select
                                    value={userOptions.find((opt) => opt.value === newMemberId) || null}
                                    onChange={(opt) => setNewMemberId(opt ? opt.value : '')}
                                    options={userOptions}
                                    placeholder="Select a member..."
                                    isClearable
                                    classNamePrefix="react-select"
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                                />
                                <button onClick={handleAddMember} className="add-member-btn">Add</button>
                            </div>
                        )}
                    </div>
                )}

                {/* group list with avatar, preview, and unread badge */}
                <div className="group-list">
                    {groups.length === 0 && (
                        <p className="no-groups-text">No groups yet. Create one to get started.</p>
                    )}
                    {groups.map((group) => {
                        const unread  = groupUnread[group._id] || 0;
                        const preview = groupPreviews[group._id] || '';
                        const isActive = selectedGroup === group._id;
                        return (
                            <button
                                key={group._id}
                                onClick={() => setSelectedGroup(group._id)}
                                className={`group-list-btn ${isActive ? 'active' : ''}`}
                            >
                                <div className="group-avatar">
                                    {group.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="group-info">
                                    <div className="group-btn-name">{group.name}</div>
                                    {preview && (
                                        <div className="group-preview">{preview}</div>
                                    )}
                                </div>
                                {unread > 0 && (
                                    <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

            </aside>

            {/* main chat panel */}
            <main className="group-chat-main">
                <div className="group-chat-header">
                    <span className="group-chat-title">
                        {selectedGroupName ? selectedGroupName : 'Select a group to start chatting'}
                    </span>
                    {selectedGroup && (
                        <button
                            className="group-settings-link"
                            onClick={() => history.push(`/group-settings/${selectedGroup}`)}
                        >
                            Settings
                        </button>
                    )}
                </div>

                <div className="message-list">
                    {messages.map((msg, index) => {
                        const { date, time } = formatMessageTime(msg.timestamp);
                        return (
                            <div key={index} className={`message-item ${msg.sender === userId ? 'sent' : 'received'}`}>
                                <div className="message-content">
                                    <span className="message-sender">
                                        {msg.sender === userId ? 'You' : users[msg.sender] || 'Anonymous'}
                                    </span>
                                    <span className="message-text">{msg.content}</span>
                                    <div className="message-info">
                                        <span>{date}</span>
                                        <span>{time}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messageEndRef} />
                </div>

                {isTyping && (
                    <div className="typing-indicator">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-text">{typingName} is typing...</span>
                    </div>
                )}

                <div className="message-input-area">
                    {showEmojiPicker && (
                        <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
                            <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                width="100%"
                                height={320}
                                searchDisabled={false}
                                skinTonesDisabled
                                previewConfig={{ showPreview: false }}
                            />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="message-form">
                        <button
                            type="button"
                            className="emoji-toggle-btn"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            title="Emoji"
                        >
                            😊
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={handleInputChange}
                            placeholder={selectedGroup ? 'Type a message...' : 'Select a group first'}
                            className="message-input"
                            disabled={!selectedGroup}
                        />
                        <button type="submit" className="send-btn" disabled={!selectedGroup || isSending}>
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default GroupChat;
