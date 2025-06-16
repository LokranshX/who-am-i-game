// frontend/src/App.js
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react'; // Добавляем useRef
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { socket } from './socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Импортируем FontAwesome
import { faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons'; // Импортируем иконки

// Ленивая загрузка компонентов
const Home = lazy(() => import('./components/Home'));
const Lobby = lazy(() => import('./components/Lobby'));
const GameRoom = lazy(() => import('./components/GameRoom'));

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

const backgroundImages = [
  bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9, bg10
];

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  // --- НОВЫЙ КОД ДЛЯ МУЗЫКИ ---
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        // Браузеры могут блокировать автовоспроизведение, но play() по клику всегда работает
        audioRef.current.play().catch(e => console.error("Ошибка воспроизведения музыки:", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };
  // --- КОНЕЦ НОВОГО КОДА ДЛЯ МУЗЫКИ ---

  const navigate = useNavigate();

  useEffect(() => {
    let currentIndex = 0;
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

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Подключено к серверу Socket.IO');
      setError('');
    });
    socket.on('disconnect', () => {
      console.log('Отключено от сервера Socket.IO');
      setGame(null);
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
    socket.on('gameError', (message) => {
      setError(message);
      console.error('Ошибка игры:', message);
    });
    socket.on('gameEnded', (message) => {
      setError(message);
      setGame(null);
      setGameCode('');
      setTimeout(() => navigate('/'), 5000);
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('gameCreated');
      socket.off('gameUpdate');
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
    setGameCode('');
    navigate('/');
  };

  return (
    <div className="app-container">
      {error && <div className="error-message">{error}</div>}
      
      {/* --- НОВЫЙ КОД: АУДИОПЛЕЕР И КНОПКА --- */}
      <audio ref={audioRef} src="/music/background-music.mp3" loop />
      <button onClick={toggleMusic} className="music-toggle-btn" title={isMusicPlaying ? "Выключить музыку" : "Включить музыку"}>
        <FontAwesomeIcon icon={isMusicPlaying ? faVolumeUp : faVolumeMute} />
      </button>
      {/* --- КОНЕЦ НОВОГО КОДА --- */}

      <Suspense fallback={<div className="loading-screen">Загрузка...</div>}>
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
                onAskQuestion={(q) => socket.emit('askQuestion', gameCode, q)}
                onAnswerQuestion={(a) => socket.emit('answerQuestion', gameCode, a)}
                onMakeGuess={(g) => socket.emit('makeGuess', gameCode, g)}
                onLeaveGame={handleLeaveGame}
              />
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router basename="/who-am-i-game">
      <App />
    </Router>
  );
}