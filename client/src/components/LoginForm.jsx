import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styling/LoginForm.css";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const LoginForm = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const submitLogin = (e) => {
    e.preventDefault();

    if (!data.email.trim() || !data.password.trim()) {
      toast.error("Please fill out all fields.", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    if (!isValidEmail(data.email)) {
      toast.error("The entered email is not valid.", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    api
      .post("/Register/login", data)
      .then((res) => {
        if (res.status === 200) {
          const { accessToken, refreshToken } = res.data;

          // update AuthContext state so ProtectedRoute sees the user as authenticated
          login(accessToken, refreshToken);

          // redirect immediately — don't wait for the dialog so the context
          // state has already updated by the time ProtectedRoute checks it
          history.push("/dashboard");

          setData({
            email: "",
            password: "",
          });
        }
      })
      .catch((err) => {
        console.error("Error occurred while logging in:", err);

        toast.error("An Error occurred while Logging in.", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });
      });
  };

  return (
    <div className="login-container mt-5 mb-5">
      <h2 className="text-info mt-5 mb-5">LOGIN FORM</h2>
      <Form onSubmit={submitLogin} className="login-form">
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="email"
            value={data.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Control
            type={showPassword ? "text" : "password"}
            name="password"
            value={data.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <Form.Check
            type="checkbox"
            id="showPasswordCheckbox"
            label={<span className="show-password-label">Show Password</span>}
            checked={showPassword}
            onChange={toggleShowPassword}
            className="toggle-password-checkbox"
          />
        </Form.Group>

        <Button variant="success" type="submit">
          Login
        </Button>

        <div className="mt-3">
          <Link to="/forgot-password" className="forgot-password">
            Forgot your password?
          </Link>
        </div>
      </Form>

      <div className="register-section mt-5">
        <p>Not Registered?</p>
        <Link to="/" className="register-link">
          Register an Account
        </Link>
      </div>

      <ToastContainer />
    </div>
  );
};

export default LoginForm;




