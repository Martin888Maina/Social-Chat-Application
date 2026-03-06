import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import '../styling/UserChat.css'; // Import your custom CSS file
import Select from 'react-select'; // Import react-select
import { useHistory } from "react-router-dom";

const socket = io('http://localhost:4000', {
  transports: ['websocket']
});

const UserChat = () => {
  const history = useHistory();
  const [message, setMessage] = useState('');//handling single message
  const [messages, setMessages] = useState([]); //handling multiple messages
  const [username, setUsername] = useState('');//handling the username
  const [users, setUsers] = useState([]);//handling users
  const [isTyping, setIsTyping] = useState(false);//handling typing action
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);//handles conclusion of typing action
  const [userId, setUserId] = useState(''); // For storing the current user's ID
  const [receiverId, setReceiverId] = useState(''); // For storing the receiver's ID
  const [searchQuery, setSearchQuery] = useState('');//handles search functionality
  const [profileData, setProfileData] = useState(null);//handles profile page
  const [receiverName, setReceiverName] = useState('');//handles the receivers name
  const [notifications, setNotifications] = useState([]);//handles notifications and alerts


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        if (!token) {
          throw new Error('No token found in sessionStorage');
        }
        console.log('Fetching user data with token:', token);

        const userResponse = await axios.get('http://localhost:4000/Register/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!userResponse.data || !userResponse.data.firstname || !userResponse.data._id) {
          throw new Error('User data is missing required fields');
        }
    
        console.log('User data fetched successfully:', userResponse.data);
        setUsername(userResponse.data.firstname);
        setUserId(userResponse.data._id); // Set the current user's ID

        // Emit the new user event with userId and username
        socket.emit('new user', userResponse.data._id, userResponse.data.firstname);

        // Fetch users list to populate user chat options
        const usersResponse = await axios.get('http://localhost:4000/Register/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Users list fetched successfully:', usersResponse.data);
        setUsers(usersResponse.data);

      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();

    socket.on('chat message', (msg) => {
        console.log('Received chat message:', msg);
        setMessages(prevMessages => {
            console.log('Previous messages:', prevMessages);
            console.log('Adding new message:', msg);
            return [...prevMessages, msg];
        });
    });
    
    
    socket.on('update users', (userList) => {
      console.log('User list updated:', userList);
      setUsers(userList);
    });
  
    socket.on('typing', (data) => {
      console.log('Typing indicator:', data);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(data.isTyping);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000); // Hide typing indicator after 3 seconds
    });

    socket.on('notification', (notification) => {
      setNotifications(prevNotifications => [...prevNotifications, notification]);
    });

    // Add event listener for beforeunload
    const handleBeforeUnload = () => {
      socket.disconnect(); // Disconnect from the socket
    };

  
    return () => {
      socket.off('chat message');
      socket.off('update users');
      socket.off('typing');
      socket.off('notification');
      window.removeEventListener('beforeunload', handleBeforeUnload); // Clean up the event listener
    };

    
  }, []);


  useEffect(() => {
    const fetchMessages = async () => {
      if (receiverId) {
        try {
          const token = sessionStorage.getItem("access_token");
          if (!token) {
            throw new Error('No token found in sessionStorage');
          }
          console.log('Fetching messages with token:', token);

          const messagesResponse = await axios.get(`http://localhost:4000/Message/messages/${userId}/${receiverId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Messages fetched successfully:', messagesResponse.data);
          setMessages(messagesResponse.data);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
  }, [receiverId, userId]); // Fetch messages when receiverId or userId changes

  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
          if (!token) {
            throw new Error('No token found in sessionStorage');
          }
          console.log('Fetching messages with token:', token);
        // Replace with your actual API endpoint and headers
        const imageresponse = await axios.get('http://localhost:4000/Register/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProfileData(imageresponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchProfileData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Current User ID:', userId);
    console.log('Receiver ID:', receiverId);
    console.log('Message Content:', message);
    if (message.trim() && userId && receiverId) {
      const timestamp = new Date().toISOString(); // Add timestamp for the message
      const messageData = {
        sender: userId, // Use userId here
        receiver: receiverId, // Use receiverId here
        content: message,
        timestamp
      };

      console.log('Sending message data:', messageData);

      try {
        const token = sessionStorage.getItem("access_token");
        if (!token) {
          throw new Error('No token found in sessionStorage');
        }
        console.log('Sending message with token:', token);
        // Send message to the server to save in the database
        const response = await axios.post('http://localhost:4000/Message/saveMessage', messageData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Message saved successfully:', response.data);

        // Emit the message to other users through WebSocket
        console.log('Emitting message:', messageData);
        socket.emit('chat message', messageData);

        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
      }
    } else {
      console.warn('Message is empty, userId or receiverId is not set.');
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { isTyping: e.target.value.length > 0, nick: username });
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out user:', username);
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem('refresh_token');
      socket.emit('logout', username);
      history.push("/LoginForm"); // Redirect to login page or any other page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const scrollToBottom = () => {
    console.log('Scrolling to bottom of the message list');
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleReceiverSelection = async (selectedOption) => {
    const username = selectedOption?.label;
    if (username) {
      try {
        const token = sessionStorage.getItem("access_token");
        const response = await axios.get('http://localhost:4000/Register/userIdByUsername', {
          headers: { Authorization: `Bearer ${token}` },
          params: { username }
        });
        setReceiverId(response.data.userId);
        setReceiverName(username);
      } catch (error) {
        console.error('Error fetching receiver ID:', error);
      }
    }
  };

  const userOptions = users.map(user => ({
    value: user._id,
    label: user.firstname,
    isOnline: users.includes(user)
  }));


  const handleSearch = async () => {
    if (searchQuery.trim() === '' || !receiverId) return;

    try {
        const token = sessionStorage.getItem("access_token");
        if (!token) {
            throw new Error('No token found in sessionStorage');
        }

        const response = await axios.get(`http://localhost:4000/Message/search/${userId}/${receiverId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { query: searchQuery }
        });

        setMessages(response.data);
    } catch (error) {
        console.error('Error searching messages:', error);
    }
};

  const handleGroupNavigation = () => {
    history.push("/GroupChat"); // Navigate to the GroupChat page
  };

  const handleProfileNavigation = () => {
    history.push("/UserProfile");
  };


  if (!profileData) return <div>Loading...</div>;

  return (

    <div className="chat-container">
      
      <div className="user-profile-section">
      {profileData.profilePicture ? (
        <img 
          src={profileData.profilePicture} 
          alt="Profile" 
          className="profile-image-large" 
        />
      ) : (
        <p>No profile picture available</p>
      )}
      <h3>{profileData.firstname} {profileData.lastname}</h3>
    </div>
     
      {/* Profile and Logout buttons */}
      <div className="chat-actions">
        <button onClick={handleProfileNavigation} className="btn btn-info profile-btn">Profile</button>
        <button onClick={handleLogout} className="btn btn-danger logout-btn">Logout</button>
        <button onClick={handleGroupNavigation} className="btn btn-secondary group-btn">Groups</button>
      </div>
     
     

      <div className="users-list">
              <h5>Select a User to Chat:</h5>
              <Select
                options={userOptions}
                onChange={handleReceiverSelection}
                placeholder="Search for users..."
                getOptionLabel={(option) => (
                  <div className="user-option">
                    <span>{option.label}</span>
                    <span className={`user-status ${option.isOnline ? 'online' : 'offline'}`}>
                      <span className="status-dot"></span>
                      {option.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                )}
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
            const time = new Date(msg.timestamp);
            const formattedDate = time.toLocaleDateString("en-US");
            const formattedTime = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" });
            return (
              <div
                key={index}
                className={`message-item ${msg.sender === userId ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  <strong>{msg.sender === userId ? 'You' : receiverName}:</strong> {msg.content}
                
                  <div className="message-info">
                    <span className="date">{formattedDate}</span>
                    <span className="time">{formattedTime}</span>
                  </div>
                </div>
              </div>
            );
        })}

        <div ref={messageEndRef} />
      </div>

      <div className="notifications">
          {notifications.map((notification, index) => (
            <div key={index} className="notification">
              {notification.content}
            </div>
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



