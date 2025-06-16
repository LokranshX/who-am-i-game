// frontend/src/socket.js
import { io } from 'socket.io-client';

// Эта строка пытается прочитать URL бэкенда, который был "встроен"
// в код во время сборки на GitHub Actions.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Если URL не был встроен (например, секрет не был найден),
// то в консоли браузера мы увидим понятное сообщение.
if (!BACKEND_URL) {
  console.error(
    "CRITICAL: Переменная REACT_APP_BACKEND_URL не была установлена во время сборки. " +
    "Приложение не сможет подключиться к серверу. " +
    "Убедитесь, что секрет 'REACT_APP_BACKEND_URL' правильно задан в настройках репозитория GitHub."
  );
}

// Если BACKEND_URL пустой, мы используем заведомо нерабочий URL, чтобы это было видно в ошибках сети.
// Это лучше, чем падение приложения или попытка подключиться к localhost.
export const socket = io(BACKEND_URL || 'https://error-backend-url-not-set.com', {
    autoConnect: false,
    transports: ['websocket', 'polling']
});