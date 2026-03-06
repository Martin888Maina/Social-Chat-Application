import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken]   = useState(() => sessionStorage.getItem('access_token'));
    const [user, setUser]     = useState(null);
    const [loading, setLoading] = useState(true);

    // re-read token from sessionStorage on mount in case the tab was restored
    useEffect(() => {
        const stored = sessionStorage.getItem('access_token');
        setToken(stored);
        setLoading(false);
    }, []);

    const login = (accessToken, refreshToken, userData) => {
        sessionStorage.setItem('access_token', accessToken);
        sessionStorage.setItem('refresh_token', refreshToken);
        setToken(accessToken);
        setUser(userData || null);
    };

    const logout = () => {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = Boolean(token);

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
