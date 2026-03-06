import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styling/GroupChat.css'; // Import your custom CSS file
import Select from 'react-select';

const socket = io('http://localhost:4000', {
  transports: ['websocket'], // Ensure WebSocket is used
});

const GroupChat = () => {
  const history = useHistory();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newMemberId, setNewMemberId] = useState('');
  const messageEndRef = useRef(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        if (!token) throw new Error('No token found in sessionStorage');

        const userIdResponse = await axios.get('http://localhost:4000/Register/userById', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserId(userIdResponse.data.userId);
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();

    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        if (!token) throw new Error('No token found in sessionStorage');

        const usersResponse = await axios.get('http://localhost:4000/Register/users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const usersDict = usersResponse.data.reduce((acc, user) => {
          acc[user._id] = user.firstname;
          return acc;
        }, {});
        setUsers(usersDict);
        setAvailableUsers(usersResponse.data);

      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();

    socket.on('group message', (msg) => {
      console.log('Received group message:', msg);
      setMessages(prevMessages => {
        if (!prevMessages.find(m => m._id === msg._id)) {
          return [...prevMessages, msg];
        }
        return prevMessages;
      });
    });

    socket.on('notification', (notification) => {
      // Handle notification
      console.log('Notification:', notification);
      if (notification.type === 'group') {
        Swal.fire({
          icon: 'info',
          title: 'New Group Message',
          text: notification.content,
          confirmButtonText: 'OK'
        });
      } else if (notification.type === 'private') {
        Swal.fire({
          icon: 'info',
          title: 'New Private Message',
          text: notification.content,
          confirmButtonText: 'OK'
        });
      }
    });

    return () => {
      socket.off('group message');
      socket.off('notification');
    };
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchGroups = async () => {
        try {
          const token = sessionStorage.getItem("access_token");
          if (!token) throw new Error('No token found in sessionStorage');

          const response = await axios.get(`http://localhost:4000/Group/users/${userId}/groups`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setGroups(response.data);
        } catch (error) {
          console.error('Error fetching groups:', error);
        }
      };

      fetchGroups();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedGroup) {
      const fetchMessages = async () => {
        try {
          const token = sessionStorage.getItem("access_token");
          if (!token) throw new Error('No token found in sessionStorage');
  
          const response = await axios.get(`http://localhost:4000/Group/groups/${selectedGroup}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching group messages:', error);
        }
      };

      fetchMessages();

      // Join the selected group room
      socket.emit('join group', selectedGroup);

      return () => {
        // Leave the group room when component unmounts or group changes
        socket.emit('leave group', selectedGroup);
      };
    }
  }, [selectedGroup]);

  const handleGroupSelection = (groupId) => {
    setSelectedGroup(groupId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && selectedGroup) {
      const messageData = {
        groupId: selectedGroup,
        sender: userId,
        content: message,
        timestamp: new Date().toISOString()
      };

      try {
        const token = sessionStorage.getItem("access_token");
        if (!token) throw new Error('No token found in sessionStorage');
  
        const response = await axios.post(`http://localhost:4000/Group/groups/${selectedGroup}/messages`, messageData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Emit the message to other users in the group through WebSocket
        socket.emit('group message', { ...messageData, _id: response.data._id });

        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleCreateGroup = () => {
    history.push('/CreateGroup'); // Navigate to the CreateGroup page
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !newMemberId) return;

    try {
      const token = sessionStorage.getItem("access_token");
      if (!token) throw new Error('No token found in sessionStorage');

      await axios.post(`http://localhost:4000/Group/groups/${selectedGroup}/members`, {
        userId: newMemberId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        title: 'Member Added',
        text: 'The member was added successfully!',
        confirmButtonText: 'OK'
      }).then(() => {
        // Optionally refresh the group data or handle state updates
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was an error adding the member. Please try again.',
        confirmButtonText: 'OK'
      });
      console.error('Error adding member:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Transform availableUsers into options for React Select
  const userOptions = availableUsers.map(user => ({
    value: user._id,
    label: `${user.firstname} ${user.lastname}`
  }));

  // Function to navigate to UserChat page
  const handleChatNavigation = () => {
    history.push('/UserChat'); // Adjust the path as needed
  };

  return (
    <div className="chat-container">
      <div className="group-chat-header">
        <button onClick={handleCreateGroup} className="btn btn-primary create-group-btn">Create New Group</button>
      </div>

      <div className="group-list">
        <h2>Groups</h2>
        {groups.map((group) => (
          <button
            key={group._id}
            onClick={() => handleGroupSelection(group._id)}
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
            value={userOptions.find(option => option.value === newMemberId)}
            onChange={selectedOption => setNewMemberId(selectedOption ? selectedOption.value : '')}
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
            const time = new Date(msg.timestamp);
            const formattedDate = time.toLocaleDateString("en-US");
            const formattedTime = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" });
            return (
              <div key={index} className={`message-item ${msg.sender === userId ? 'user-message' : 'group-message'}`}>
                <div className="message-content">
                  <strong>{msg.sender === userId ? 'You' : users[msg.sender] || 'Anonymous'}:</strong>
                  {msg.content}
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
      <button onClick={handleChatNavigation} className="btn btn-info mt-3 go-to-user-chat">Go to User Chat</button>
    </div>
  );
};

export default GroupChat;
