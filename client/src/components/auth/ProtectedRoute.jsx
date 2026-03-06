import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// wrap protected routes — redirects to login if no token
const ProtectedRoute = ({ component: Component, ...rest }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null;

    return (
        <Route
            {...rest}
            render={(props) =>
                isAuthenticated
                    ? <Component {...props} />
                    : <Redirect to="/login" />
            }
        />
    );
};

export default ProtectedRoute;
