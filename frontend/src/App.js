// frontend/src/App.js

import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { socket } from './socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faVolumeMute } from '@fortawesome/free-solid-svg-icons';

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

const Home = lazy(() => import('./components/Home'));
const Lobby = lazy(() => import('./components/Lobby'));
const GameRoom = lazy(() => import('./components/GameRoom'));

const backgroundImages = [
  bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9, bg10
];

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Ошибка воспроизведения музыки:", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

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

  // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
  const handleCreateGame = (playerData) => {
    if (!socket.connected) socket.connect();
    setPlayerName(playerData.name);
    socket.emit('createGame', playerData);
  };

  // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
  const handleJoinGame = (code, playerData) => {
    if (!socket.connected) socket.connect();
    setPlayerName(playerData.name);
    setGameCode(code);
    socket.emit('joinGame', code, playerData);
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
      
      <audio ref={audioRef} src="/who-am-i-game/music/background-music.mp3" loop />
      <button onClick={toggleMusic} className="music-toggle-btn" title={isMusicPlaying ? "Выключить музыку" : "Включить музыку"}>
        <FontAwesomeIcon icon={isMusicPlaying ? faVolumeUp : faVolumeMute} />
      </button>

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