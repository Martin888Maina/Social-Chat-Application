import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { disconnectSocket } from '../../utils/socketManager';
import '../../components/styling/Navbar.css';

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const history = useHistory();

    const handleLogout = () => {
        const username = sessionStorage.getItem('username');
        if (username) {
            const { getSocket } = require('../../utils/socketManager');
            const socket = getSocket();
            socket.emit('logout', username);
        }
        disconnectSocket();
        logout();
        history.push('/login');
    };

    return (
        <nav className="app-navbar">
            <div className="navbar-brand">
                <Link to={isAuthenticated ? '/dashboard' : '/'}>Chat App</Link>
            </div>

            <div className="navbar-links">
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard">Home</Link>
                        <Link to="/chat">Chat</Link>
                        <Link to="/groups">Groups</Link>
                        <Link to="/profile">Profile</Link>
                        <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
