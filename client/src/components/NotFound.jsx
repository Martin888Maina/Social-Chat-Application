import React from "react";
import { useHistory } from "react-router-dom";
import "./styling/NotFound.css";

const NotFound = () => {
  const history = useHistory();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <div className="not-found-divider" />
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-subtitle">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <button
            onClick={() => history.goBack()}
            className="not-found-btn not-found-btn-outline"
          >
            Go Back
          </button>
          <button
            onClick={() => history.push('/')}
            className="not-found-btn not-found-btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
