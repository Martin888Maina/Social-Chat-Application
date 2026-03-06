import React from 'react';
import { Alert } from 'react-bootstrap';

function ErrorAlert({ message, onDismiss }) {
    if (!message) return null;

    return (
        <Alert
            variant="danger"
            dismissible={!!onDismiss}
            onClose={onDismiss}
            className="error-alert"
        >
            {message}
        </Alert>
    );
}

export default ErrorAlert;
