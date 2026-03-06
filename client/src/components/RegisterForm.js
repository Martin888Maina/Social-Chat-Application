import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styling/RegisterForm.css";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const RegisterForm = () => {
  const history = useHistory();
  const [data, setData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    telephone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidTelephone = (telephone) => {
    const telephoneRegex = /^\+?\d{7,}$/;
    return telephoneRegex.test(telephone);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const submitRegister = (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem("access_token");

    // Validation checks
    if (!data.firstname.trim() || !data.lastname.trim() || !data.email.trim() || !data.telephone.trim() || !data.password.trim() || !data.confirmPassword.trim()) {
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

    if (!isValidTelephone(data.telephone)) {
      toast.error("The entered telephone number is not valid.", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match.", {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 3000,
      });
      return;
    }

    // Exclude confirmPassword from the payload
    const { confirmPassword, ...registrationData } = data;

    axios
      .post("http://localhost:4000/Register/register", registrationData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: 'New User Record Added Successfully',
          confirmButtonText: 'OK'
        }).then(() => {
          setData({
            firstname: "",
            lastname: "",
            email: "",
            telephone: "",
            password: "",
            confirmPassword: "",
          });

          history.push("/LoginForm");
        });
      })
      .catch((err) => {
        toast.error("An Error occurred while adding the Record.", {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 3000,
        });
      });
  };

  return (
    <div className="register-container">
      <h2 className="text-info mt-5 mb-5">REGISTER FORM</h2>
      <Form onSubmit={submitRegister} className="register-form">
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="firstname"
            value={data.firstname}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="lastname"
            value={data.lastname}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Control
            type="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            name="telephone"
            value={data.telephone}
            onChange={handleChange}
            placeholder="Telephone"
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

        <Form.Group className="mb-3">
          <Form.Control
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={data.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            required
          />
          <Form.Check
            type="checkbox"
            id="showConfirmPasswordCheckbox"
            label={<span className="show-password-label">Show Password</span>}
            checked={showConfirmPassword}
            onChange={toggleShowConfirmPassword}
            className="toggle-password-checkbox"
          />
        </Form.Group>

        <Button variant="success" type="submit">
          Register
        </Button>

        <div className="mt-3">
          <p>Already Registered?</p>
          <Link to="./LoginForm" className="login-link">
            Login into Account
          </Link>
        </div>
      </Form>

      <ToastContainer />
    </div>
  );
};

export default RegisterForm;


