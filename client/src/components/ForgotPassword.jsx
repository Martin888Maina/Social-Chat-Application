import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import 'react-toastify/dist/ReactToastify.css';
import './styling/ForgotPassword.css'; 
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const ForgotPassword = () => {

  const [email, setEmail] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();

    api
      .post('/Password/forgot', { email })
      .then((res) => {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Email Sent',
          text: 'Password reset email sent successfully.',
          confirmButtonText: 'OK'
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error sending password reset email.',
          confirmButtonText: 'OK'
        });
        console.error('Error sending password reset email:', err);
      });
  };

  return (
    <div className="forgot-password-container">
      <h2 className="text-info mt-5 mb-5">Forgot Password</h2>
      <Form onSubmit={handleResetPassword} className="forgot-password-form">
        <Form.Group className="mb-3">
          <Form.Control type="email" name="email" value={email} onChange={handleEmailChange} placeholder="Enter your email" required />
        </Form.Group>

        <Button variant="primary" type="submit" className="mt-3">
          Reset Password
        </Button>

        <div className="link-section mt-5">
          <p>Want to head back to the Login?</p>
          <Link to="./LoginForm" className="forgot-login">
            Proceed to Login page
          </Link>
        </div>

        <div className="link-section mt-5">
          <p>Want to proceed to the Password Reset Page?</p>
          <Link to="./PasswordReset" className="password-reset">
            Proceed to Password Reset page
          </Link>
        </div>
      </Form>
    </div>
  );
};

export default ForgotPassword;












