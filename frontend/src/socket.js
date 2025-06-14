// frontend/src/socket.js
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const socket = io(BACKEND_URL, {
    autoConnect: false // Не подключаемся автоматически, будем подключаться по требованию
});