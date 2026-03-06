import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from "react-router-dom"; // Import useHistory for navigation
import '../styling/UserProfile.css'; // Ensure this file exists for custom styling

const UserProfile = () => {
  const history = useHistory(); // Initialize history
  const [userData, setUserData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    telephone: '',
    profilePicture: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        if (!token) {
          throw new Error('No token found in sessionStorage');
        }
        const response = await axios.get('http://localhost:4000/Register/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setMessage('Error fetching profile. Please try again later.');
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setImageUrl(''); // Clear URL input when file is selected
  };

  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    setSelectedFile(null); // Clear file input when URL is entered
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token found in sessionStorage');
      }

      const formData = new FormData();
      formData.append('firstname', userData.firstname);
      formData.append('lastname', userData.lastname);
      formData.append('email', userData.email);
      formData.append('telephone', userData.telephone);

      const response = await axios.patch('http://localhost:4000/Register/updateProfile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('Profile updated successfully!');
      setUserData(response.data);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    }
  };

  const handleProfilePictureUpdate = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        throw new Error('No token found in sessionStorage');
      }

      const data = {
        profilePictureUrl: imageUrl
      };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        await axios.post('http://localhost:4000/Register/updateProfilePictureUrl', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else if (imageUrl) {
        await axios.post('http://localhost:4000/Register/updateProfilePictureUrl', data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      setMessage('Profile picture updated successfully!');
      setUserData({ ...userData, profilePicture: imageUrl });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      setMessage('Error updating profile picture. Please try again.');
    }
  };

    // Function to navigate to UserChat page
    const handleChatRedirect = () => {
      history.push('/UserChat'); // Adjust the path as needed
    };
  

  return (
    <div className="profile-container">
      <h2>Manage Your Profile</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleProfileUpdate}>
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="firstname"
            value={userData.firstname}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            name="lastname"
            value={userData.lastname}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label>Telephone</label>
          <input
            type="text"
            name="telephone"
            value={userData.telephone}
            onChange={handleInputChange}
            className="form-control"
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Profile</button>
      </form>
      <div className="form-group">
        <label>Profile Picture (Upload or URL)</label>
        <input
          type="file"
          name="profilePicture"
          onChange={handleFileChange}
          className="form-control"
        />
        <input
          type="text"
          placeholder="Or enter image URL here"
          value={imageUrl}
          onChange={handleUrlChange}
          className="form-control"
        />
        {userData.profilePicture && (
          <img
            src={userData.profilePicture}
            alt="Profile"
            className="profile-picture"
          />
        )}
        <button onClick={handleProfilePictureUpdate} className="btn btn-secondary">Update Profile Picture</button>
      </div>
      <button onClick={handleChatRedirect} className="btn btn-info">Back to Chat</button> {/* Button to redirect to UserChat */}
    </div>
  );
};

export default UserProfile;
