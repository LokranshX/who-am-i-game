// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css'; // Подключаем основные стили
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);