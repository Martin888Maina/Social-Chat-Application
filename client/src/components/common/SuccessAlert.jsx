import React from 'react';
import { Alert } from 'react-bootstrap';

function SuccessAlert({ message, onDismiss }) {
    if (!message) return null;

    return (
        <Alert
            variant="success"
            dismissible={!!onDismiss}
            onClose={onDismiss}
            className="success-alert"
        >
            {message}
        </Alert>
    );
}

export default SuccessAlert;
