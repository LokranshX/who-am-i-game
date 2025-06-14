// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { socket } from './socket';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

// --- ШАГ 1: Импортируем все изображения как модули ---
import bg1 from './images/bg1.jpg';
import bg2 from './images/bg2.jpg';
import bg3 from './images/bg3.jpg';
import bg4 from './images/bg4.jpg';
import bg5 from './images/bg5.jpg';
import bg6 from './images/bg6.jpg';
import bg7 from './images/bg7.jpg';
import bg8 from './images/bg8.jpg';
import bg9 from './images/bg9.jpg';
import bg10 from './images/bg10.jpg';


// --- ШАГ 2: Создаем массив из импортированных изображений ---
const backgroundImages = [
  bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9, bg10
];

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [game, setGame] = useState(null);
  const [characterOnForehead, setCharacterOnForehead] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // --- ШАГ 3: Используем массив в логике смены фона ---
  useEffect(() => {
    let currentIndex = 0;
    // Устанавливаем начальный фон
    // Теперь мы используем переменную напрямую, без process.env.PUBLIC_URL
    document.body.style.backgroundImage = `url(${backgroundImages[currentIndex]})`;

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % backgroundImages.length;
      const nextImage = backgroundImages[currentIndex];
      
      const img = new Image();
      img.src = nextImage;
      img.onload = () => {
        document.body.style.backgroundImage = `url(${nextImage})`;
      };
    }, 8000);

    return () => clearInterval(intervalId);
  }, []);

  // Логика сокетов остается без изменений
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Подключено к серверу Socket.IO');
      setError('');
    });
    socket.on('disconnect', () => {
      console.log('Отключено от сервера Socket.IO');
      setGame(null);
      setCharacterOnForehead(null);
      setGameCode('');
      setError('Вы были отключены от сервера.');
      navigate('/');
    });
    socket.on('gameCreated', (code) => {
      setGameCode(code);
      navigate(`/lobby/${code}`);
    });
    socket.on('gameUpdate', (updatedGame) => {
      setGame(updatedGame);
      setError('');
    });
    socket.on('characterAssigned', (character) => {
      setCharacterOnForehead(character);
    });
    socket.on('gameError', (message) => {
      setError(message);
      console.error('Ошибка игры:', message);
    });
    socket.on('gameEnded', (message) => {
      setError(message);
      setGame(null);
      setCharacterOnForehead(null);
      setGameCode('');
      setTimeout(() => navigate('/'), 1000);
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameCreated');
      socket.off('gameUpdate');
      socket.off('characterAssigned');
      socket.off('gameError');
      socket.off('gameEnded');
    };
  }, [navigate]);

  const handleCreateGame = (name) => {
    if (!socket.connected) socket.connect();
    setPlayerName(name);
    socket.emit('createGame', name);
  };

  const handleJoinGame = (code, name) => {
    if (!socket.connected) socket.connect();
    setPlayerName(name);
    setGameCode(code);
    socket.emit('joinGame', code, name);
    navigate(`/lobby/${code}`);
  };

  const handleLeaveGame = () => {
    if (gameCode) {
      socket.emit('leaveGame', gameCode);
    }
    setGame(null);
    setCharacterOnForehead(null);
    setGameCode('');
    navigate('/');
  };

  return (
    <div className="app-container">
      {error && <div className="error-message">{error}</div>}
      <Routes>
        <Route path="/" element={<Home onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />} />
        <Route
          path="/lobby/:gameCode"
          element={
            <Lobby
              game={game}
              playerName={playerName}
              socketId={socket.id}
              onStartGame={() => socket.emit('startGame', gameCode)}
              onSubmitCharacter={(char) => socket.emit('submitCharacter', gameCode, char)}
              onChatMessage={(msg) => socket.emit('chatMessage', gameCode, msg)}
              onLeaveGame={handleLeaveGame}
            />
          }
        />
        <Route
          path="/game/:gameCode"
          element={
            <GameRoom
              game={game}
              playerName={playerName}
              socketId={socket.id}
              characterOnForehead={characterOnForehead}
              onAskQuestion={(q) => socket.emit('askQuestion', gameCode, q)}
              onAnswerQuestion={(a) => socket.emit('answerQuestion', gameCode, a)}
              onMakeGuess={(g) => socket.emit('makeGuess', gameCode, g)}
              onChatMessage={(msg) => socket.emit('chatMessage', gameCode, msg)}
              onLeaveGame={handleLeaveGame}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}