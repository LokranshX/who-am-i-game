// frontend/src/socket.js
import { io } from 'socket.io-client';

// URL вашего рабочего бэкенда на Vercel
const vercelBackendUrl = 'https://who-am-i-game-eight.vercel.app/';

// URL для локальной разработки
const localBackendUrl = 'http://localhost:5000';

// Умное переключение между адресами:
// process.env.NODE_ENV устанавливается автоматически:
// - в 'production' при выполнении `npm run build` (для GitHub Pages)
// - в 'development' при выполнении `npm start` (локально)
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? vercelBackendUrl
  : localBackendUrl;

export const socket = io(BACKEND_URL, {
    autoConnect: false,
    // Важное дополнение для Vercel, чтобы избежать проблем с CORS при первом подключении
    transports: ['websocket', 'polling']
});