import { io } from 'socket.io-client';

// singleton — all components share the same connection
let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
            transports: ['websocket'],
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
