import React from "react";
import { useHistory } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styling/LogoutPage.css';
import { Button } from "react-bootstrap";


const Logout = () => {
    const history = useHistory();
   
    const handleExit = () => {
        // Clear session storage
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');

        // Redirect the user to the landing page
        history.push('/login');
    }

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        handleExit(); // Call handleExit function to logout
    }

    return (
        <div className="logout-container">
            <h1 className="logout-heading">Click to Logout</h1>

            <form onSubmit={handleSubmit}>
                <div className="button mx-auto">
                   <Button type="submit" className="logout-button btn btn-warning btn-lg">Logout</Button>
                </div>
            </form>

        </div>
    );
}

export default Logout;
