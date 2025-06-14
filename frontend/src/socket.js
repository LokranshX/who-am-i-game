import { io } from 'socket.io-client';

// Во время сборки на GitHub Actions, process.env.REACT_APP_BACKEND_URL будет заменен на ваш секрет.
// При локальной разработке он будет undefined, и мы будем использовать localhost.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const socket = io(BACKEND_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
});