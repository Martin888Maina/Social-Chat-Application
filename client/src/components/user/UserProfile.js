import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';
import '../styling/UserProfile.css';

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
        const response = await api.get('/Register/user');
        setUserData(response.data);
      } catch (error) {
        console.error('failed to fetch profile:', error);
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
      const response = await api.patch('/Register/updateProfile', {
        firstname: userData.firstname,
        lastname:  userData.lastname,
        email:     userData.email,
        telephone: userData.telephone,
      });
      setMessage('Profile updated successfully!');
      setUserData(response.data);
    } catch (error) {
      console.error('failed to update profile:', error);
      setMessage('Error updating profile. Please try again.');
    }
  };

  const handleProfilePictureUpdate = async () => {
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);
        // multipart upload — override the default content-type for this one call
        await api.post('/Register/updateProfilePictureUrl', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (imageUrl) {
        await api.post('/Register/updateProfilePictureUrl', { profilePictureUrl: imageUrl });
      }
      setMessage('Profile picture updated successfully!');
      setUserData({ ...userData, profilePicture: imageUrl });
    } catch (error) {
      console.error('failed to update profile picture:', error);
      setMessage('Error updating profile picture. Please try again.');
    }
  };

  const handleChatRedirect = () => {
    history.push('/UserChat');
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
