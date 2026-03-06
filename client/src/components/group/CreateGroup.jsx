import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../../services/api';
import Select from 'react-select';
import 'sweetalert2/dist/sweetalert2.min.css';
import '../styling/CreateGroup.css';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/Register/users');
        const userOptions = response.data.map(user => ({
          value: user._id,
          label: `${user.firstname} ${user.lastname}`
        }));
        setUsers(userOptions);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleMemberSelection = (selectedOptions) => {
    setSelectedMembers(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/Group/groups', {
        name: groupName,
        members: selectedMembers,
      });

      Swal.fire({
        icon: 'success',
        title: 'Group Created',
        text: 'The group was created successfully!',
        confirmButtonText: 'OK'
      }).then(() => {
        window.location.href = '/groups';
      });

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was an error creating the group. Please try again.',
        confirmButtonText: 'OK'
      });
      console.error('Error creating group:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className="create-group-container">
      <h1>Create New Group</h1>
      <form onSubmit={handleSubmit} className="create-group-form">
        <div className="form-group">
          <label htmlFor="groupName">Group Name:</label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Select Members:</label>
          <Select
            isMulti
            options={users}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={handleMemberSelection}
          />
        </div>
        <button type="submit" className="btn btn-primary">Create Group</button>
      </form>
    </div>
  );
};

export default CreateGroup;
