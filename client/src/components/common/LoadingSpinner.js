import React from 'react';
import { Spinner } from 'react-bootstrap';

function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="loading-spinner-container">
            <Spinner animation="border" role="status" variant="primary" />
            <span className="loading-message">{message}</span>
        </div>
    );
}

export default LoadingSpinner;
