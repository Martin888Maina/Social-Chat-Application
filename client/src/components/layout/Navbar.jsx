import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../utils/socketManager';
import '../../components/styling/Navbar.css';

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const history = useHistory();

    const handleLogout = () => {
        // tell the server this user is gone before clearing the session
        const socket = getSocket();
        const username = sessionStorage.getItem('username');
        if (username) socket.emit('logout', username);

        logout();
        history.push('/LoginForm');
    };

    return (
        <nav className="app-navbar">
            <div className="navbar-brand">
                <Link to={isAuthenticated ? '/UserChat' : '/'}>SocialChat</Link>
            </div>

            <div className="navbar-links">
                {isAuthenticated ? (
                    <>
                        <Link to="/UserChat">Chat</Link>
                        <Link to="/GroupChat">Groups</Link>
                        <Link to="/UserProfile">Profile</Link>
                        <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/LoginForm">Login</Link>
                        <Link to="/">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
