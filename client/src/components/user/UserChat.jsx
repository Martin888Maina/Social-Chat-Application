import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import api from '../../services/api';
import { getSocket } from '../../utils/socketManager';
import { formatMessageTime } from '../../utils/formatDate';
import '../styling/UserChat.css';

const UserChat = () => {
    const history = useHistory();
    const socket  = getSocket();

    const [message, setMessage]                 = useState('');
    const [messages, setMessages]               = useState([]);
    const [username, setUsername]               = useState('');
    const [userId, setUserId]                   = useState('');
    const [profileData, setProfileData]         = useState(null);
    const [receiverId, setReceiverId]           = useState('');
    const [receiverName, setReceiverName]       = useState('');
    const [isTyping, setIsTyping]               = useState(false);
    const [typingName, setTypingName]           = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSending, setIsSending]             = useState(false);

    // conversation list with unread badges
    const [conversations, setConversations]     = useState([]);
    const [unreadCounts, setUnreadCounts]       = useState({});

    // new-chat user search
    const [allUsers, setAllUsers]               = useState([]);
    const [newChatQuery, setNewChatQuery]       = useState('');
    const [showUserResults, setShowUserResults] = useState(false);

    const [searchQuery, setSearchQuery]         = useState('');

    const messageEndRef  = useRef(null);
    const typingTimeout  = useRef(null);
    const emojiPickerRef = useRef(null);
    const inputRef       = useRef(null);
    const newChatRef     = useRef(null);
    // keep a ref to current receiverId so socket callbacks can read it without stale closure
    const receiverIdRef  = useRef('');

    useEffect(() => {
        receiverIdRef.current = receiverId;
    }, [receiverId]);

    // load user info on mount and wire up socket listeners
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRes = await api.get('/Register/user');
                const { _id, firstname, lastname, profilePicture } = userRes.data;
                setUsername(firstname);
                setUserId(_id);
                setProfileData({ firstname, lastname, profilePicture });
                socket.emit('new user', _id, firstname);

                // fetch full user list for the new-chat search
                const usersRes = await api.get('/Register/users');
                setAllUsers(usersRes.data);
            } catch (err) {
                console.error('failed to load user data:', err);
            }
        };
        fetchUserData();

        socket.on('chat message', (msg) => {
            const openReceiver = receiverIdRef.current;

            if (msg.receiver === openReceiver || msg.sender === openReceiver) {
                setMessages((prev) => {
                    // dedup: drop if we already have this message by _id or clientId
                    if (msg._id    && prev.some((m) => m._id      === msg._id))      return prev;
                    if (msg.clientId && prev.some((m) => m.clientId === msg.clientId)) return prev;
                    return [...prev, msg];
                });
            }

            if (msg.sender && msg.sender !== openReceiver) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [msg.sender]: (prev[msg.sender] || 0) + 1,
                }));
                setConversations((prev) =>
                    prev.map((c) =>
                        c.contactId === msg.sender
                            ? { ...c, lastMessage: msg.content, lastTimestamp: msg.timestamp, unread: (c.unread || 0) + 1 }
                            : c
                    )
                );
            }
        });

        socket.on('typing', (data) => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            setTypingName(data.nick || 'Someone');
            setIsTyping(data.isTyping);
            if (data.isTyping) {
                typingTimeout.current = setTimeout(() => setIsTyping(false), 3000);
            }
        });

        return () => {
            socket.off('chat message');
            socket.off('typing');
        };
    }, []);

    // load conversation list once we have the userId
    useEffect(() => {
        if (!userId) return;
        const fetchConversations = async () => {
            try {
                const res = await api.get('/Message/conversations');
                setConversations(res.data);
                // seed unread map from the list
                const counts = {};
                res.data.forEach((c) => { if (c.unread > 0) counts[c.contactId] = c.unread; });
                setUnreadCounts(counts);
            } catch (err) {
                console.error('failed to load conversations:', err);
            }
        };
        fetchConversations();
    }, [userId]);

    // fetch history and mark as read whenever the selected contact changes
    useEffect(() => {
        if (!receiverId || !userId) return;

        const fetchAndMark = async () => {
            try {
                const res = await api.get(`/Message/messages/${userId}/${receiverId}`);
                setMessages(res.data);
                setIsTyping(false);

                // mark incoming messages from this contact as read
                await api.patch(`/Message/mark-read/${receiverId}`);

                // clear badge
                setUnreadCounts((prev) => {
                    const updated = { ...prev };
                    delete updated[receiverId];
                    return updated;
                });
                setConversations((prev) =>
                    prev.map((c) => (c.contactId === receiverId ? { ...c, unread: 0 } : c))
                );
            } catch (err) {
                console.error('failed to fetch messages:', err);
            }
        };

        fetchAndMark();
    }, [receiverId, userId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // close emoji picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            // close new-chat results if clicking outside the search box
            if (newChatRef.current && !newChatRef.current.contains(e.target)) {
                setShowUserResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelectContact = (contactId, contactName) => {
        setReceiverId(contactId);
        setReceiverName(contactName);
        setSearchQuery('');
    };

    // start a fresh conversation with someone not yet in the list
    const handleStartNewChat = (user) => {
        setNewChatQuery('');
        setShowUserResults(false);
        setReceiverId(user._id);
        setReceiverName(`${user.firstname} ${user.lastname}`);
        // add them to the conversation list if they're not already there
        setConversations((prev) => {
            if (prev.find((c) => c.contactId === user._id)) return prev;
            return [
                {
                    contactId:      user._id,
                    contactName:    `${user.firstname} ${user.lastname}`,
                    profilePicture: user.profilePicture || '',
                    lastMessage:    '',
                    lastTimestamp:  new Date().toISOString(),
                    unread:         0,
                },
                ...prev,
            ];
        });
    };

    // filter allUsers by the typed query, excluding yourself
    const userSearchResults = newChatQuery.trim().length > 0
        ? allUsers.filter((u) =>
            u._id !== userId &&
            `${u.firstname} ${u.lastname}`.toLowerCase().includes(newChatQuery.toLowerCase())
          )
        : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim() || !userId || !receiverId || isSending) return;

        const clientId   = crypto.randomUUID();
        const messageData = {
            sender:    userId,
            receiver:  receiverId,
            content:   message,
            timestamp: new Date().toISOString(),
            clientId,
        };

        setIsSending(true);
        try {
            const res = await api.post('/Message/saveMessage', messageData);
            // emit with the DB-assigned _id so receivers can dedup by it
            socket.emit('chat message', { ...messageData, _id: res.data._id });
            socket.emit('typing', { isTyping: false, nick: username, recipientId: receiverId });
            setMessage('');
            setShowEmojiPicker(false);

            setConversations((prev) => {
                const exists = prev.find((c) => c.contactId === receiverId);
                if (exists) {
                    return prev.map((c) =>
                        c.contactId === receiverId
                            ? { ...c, lastMessage: message, lastTimestamp: messageData.timestamp }
                            : c
                    );
                }
                return [
                    { contactId: receiverId, contactName: receiverName, profilePicture: '', lastMessage: message, lastTimestamp: messageData.timestamp, unread: 0 },
                    ...prev,
                ];
            });
        } catch (err) {
            console.error('failed to send message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        socket.emit('typing', {
            isTyping:    e.target.value.length > 0,
            nick:        username,
            recipientId: receiverId,
        });
    };

    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        socket.emit('logout', username);
        history.push('/login');
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !receiverId) return;
        try {
            const res = await api.get(`/Message/search/${userId}/${receiverId}`, { params: { query: searchQuery } });
            setMessages(res.data);
        } catch (err) {
            console.error('message search failed:', err);
        }
    };

    if (!profileData) return <div className="chat-loading">Loading...</div>;

    return (
        <div className="chat-page">
            {/* sidebar */}
            <aside className="chat-sidebar">
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

                <nav className="sidebar-nav">
                    <button onClick={() => history.push('/dashboard')} className="sidebar-nav-btn">Home</button>
                    <button onClick={() => history.push('/groups')}    className="sidebar-nav-btn">Groups</button>
                    <button onClick={() => history.push('/profile')}   className="sidebar-nav-btn">Profile</button>
                    <button onClick={handleLogout}                     className="sidebar-nav-btn danger">Logout</button>
                </nav>

                {receiverId && (
                    <div className="search-section">
                        <label className="select-label">Search messages</label>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch}>Go</button>
                        </div>
                    </div>
                )}

                {/* new conversation — search input + browse dropdown */}
                <div className="new-chat-section" ref={newChatRef}>
                    <label className="select-label">New Conversation</label>
                    <div className="new-chat-input-row">
                        <input
                            type="text"
                            className="new-chat-input"
                            placeholder="Search people..."
                            value={newChatQuery}
                            onChange={(e) => {
                                setNewChatQuery(e.target.value);
                                setShowUserResults(true);
                            }}
                            onFocus={() => setShowUserResults(true)}
                        />
                        {/* toggle button — shows everyone when no query is typed */}
                        <button
                            type="button"
                            className={`new-chat-toggle-btn ${showUserResults ? 'open' : ''}`}
                            onClick={() => setShowUserResults((prev) => !prev)}
                            title="Browse all users"
                        >
                            ▾
                        </button>
                    </div>

                    {showUserResults && (
                        <div className="new-chat-results">
                            {/* when nothing is typed, show everyone; when typed, show filtered */}
                            {(newChatQuery.trim().length === 0
                                ? allUsers.filter((u) => u._id !== userId)
                                : userSearchResults
                            ).length === 0 ? (
                                <div className="new-chat-no-results">No users found</div>
                            ) : (
                                (newChatQuery.trim().length === 0
                                    ? allUsers.filter((u) => u._id !== userId)
                                    : userSearchResults
                                ).map((user) => (
                                    <button
                                        key={user._id}
                                        className="new-chat-result-item"
                                        onClick={() => handleStartNewChat(user)}
                                    >
                                        <div className="conversation-avatar">
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.firstname} />
                                            ) : (
                                                <span>{user.firstname?.[0]?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <span className="new-chat-result-name">
                                            {user.firstname} {user.lastname}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* conversation list with unread badges */}
                <div className="conversation-list-header">
                    <span className="select-label">Messages</span>
                </div>
                <div className="conversation-list">
                    {conversations.length === 0 && (
                        <p className="no-conversations-text">No conversations yet.</p>
                    )}
                    {conversations.map((conv) => {
                        const totalUnread = unreadCounts[conv.contactId] ?? conv.unread;
                        const isActive    = conv.contactId === receiverId;
                        return (
                            <button
                                key={conv.contactId}
                                className={`conversation-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelectContact(conv.contactId, conv.contactName)}
                            >
                                <div className="conversation-avatar">
                                    {conv.profilePicture ? (
                                        <img src={conv.profilePicture} alt={conv.contactName} />
                                    ) : (
                                        <span>{conv.contactName?.[0]?.toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-name">{conv.contactName}</div>
                                    <div className="conversation-preview">{conv.lastMessage}</div>
                                </div>
                                {totalUnread > 0 && (
                                    <span className="unread-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* main chat panel */}
            <main className="chat-main">
                <div className="chat-main-header">
                    <span className="chat-with-label">
                        {receiverName ? `Chatting with ${receiverName}` : 'Select a conversation to start chatting'}
                    </span>
                </div>

                <div className="message-list">
                    {messages.map((msg, index) => {
                        const { date, time } = formatMessageTime(msg.timestamp);
                        return (
                            <div key={index} className={`message-item ${msg.sender === userId ? 'sent' : 'received'}`}>
                                <div className="message-content">
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

                {isTyping && receiverName && (
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
                            placeholder={receiverId ? 'Type a message...' : 'Select a conversation first'}
                            className="message-input"
                            disabled={!receiverId}
                        />
                        <button type="submit" className="send-btn" disabled={!receiverId || isSending}>
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default UserChat;
