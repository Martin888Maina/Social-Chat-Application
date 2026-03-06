import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styling/PasswordReset.css';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const PasswordReset = () => {

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords Do Not Match',
        text: 'Please make sure the passwords match.',
        confirmButtonText: 'OK'
      });
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    try {
      const response = await api.post('/Password/reset', { token, newPassword });

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful',
          text: 'Your password has been successfully reset.',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error Resetting Password',
        text: 'An error occurred while resetting your password. Please try again later.',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="password-reset-container">
      <h2>Password Reset</h2>
      <Form onSubmit={handleResetPassword} className="password-reset-form">
        <Form.Group className="mb-3">
        {/* <Form.Label>New Password:</Form.Label> */}
          <Form.Control
            type={showPassword ? "text" : "password"}
            name="newPassword"
            value={newPassword}
            onChange={handlePasswordChange}
            placeholder="Enter your new password"
            required
          />
          <Form.Check
            type="checkbox"
            id="showPasswordCheckbox"
            // label="Show Password"
            label={<span className="show-password-label">Show Password</span>}
            checked={showPassword}
            onChange={toggleShowPassword}
            className="toggle-password-checkbox"
          />
        </Form.Group>

        <Form.Group className="mt-3">
          {/* <Form.Label>Confirm Password:</Form.Label> */}
          <Form.Control
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm your new password"
            required
          />
          <Form.Check
            type="checkbox"
            id="showConfirmPasswordCheckbox"
            // label="Show Confirm Password"
            label={<span className="show-password-label">Show Password</span>}
            checked={showConfirmPassword}
            onChange={toggleShowConfirmPassword}
            className="toggle-password-checkbox"
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Reset Password
        </Button>

        <div className="link-section mt-5">
          <p>Want to head back to the Login?</p>
          <Link to="/login" className="login-page">
            Proceed to Login page
          </Link>
        </div>
      </Form>
      <ToastContainer />
    </div>
  );
};

export default PasswordReset;













