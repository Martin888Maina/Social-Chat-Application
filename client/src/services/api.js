import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// attach the token from sessionStorage on every request
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// global 401 handler — clear session and redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            window.location.href = '/LoginForm';
        }
        return Promise.reject(error);
    }
);

export default api;
