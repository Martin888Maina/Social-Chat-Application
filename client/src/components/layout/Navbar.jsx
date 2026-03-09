import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { disconnectSocket } from '../../utils/socketManager';
import '../../components/styling/Navbar.css';

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const history = useHistory();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        const username = sessionStorage.getItem('username');
        if (username) {
            const { getSocket } = require('../../utils/socketManager');
            const socket = getSocket();
            socket.emit('logout', username);
        }
        disconnectSocket();
        logout();
        setMenuOpen(false);
        history.push('/login');
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="app-navbar">
            <div className="navbar-brand">
                <Link to={isAuthenticated ? '/dashboard' : '/'}>Chat App</Link>
            </div>

            {/* hamburger button — visible only on small screens */}
            <button
                className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation"
            >
                <span />
                <span />
                <span />
            </button>

            <div className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
                {isAuthenticated ? (
                    <>
                        <Link to="/dashboard" onClick={closeMenu}>Home</Link>
                        <Link to="/chat"      onClick={closeMenu}>Chat</Link>
                        <Link to="/groups"    onClick={closeMenu}>Groups</Link>
                        <Link to="/profile"   onClick={closeMenu}>Profile</Link>
                        <button onClick={handleLogout} className="nav-logout-btn">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" onClick={closeMenu}>Login</Link>
                        <Link to="/"      onClick={closeMenu}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
