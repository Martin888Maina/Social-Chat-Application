import React from 'react';
import '../../components/styling/Footer.css';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <p>SocialChat &copy; {year}. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
