// frontend/src/components/Lobby.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { socket } from '../socket';
import PlayerCard from './PlayerCard';
import HistoryLog from './HistoryLog';

function Lobby({ game, playerName, socketId, onStartGame, onSubmitCharacter, onLeaveGame }) {
  const [characterInput, setCharacterInput] = useState('');
  const navigate = useNavigate();
  const { gameCode } = useParams();

  useEffect(() => {
    // Если мы попали на страницу и у нас нет данных об игре, запрашиваем их
    if (!game) {
      if (!socket.connected) socket.connect();
      socket.emit('getGame', gameCode);
    }

    if (game && game.status === 'in-progress') {
      navigate(`/game/${game.code}`);
    }
  }, [game, gameCode, navigate]);

  // Добавлена более строгая проверка на наличие ключевых полей
  if (!game || !game.players || !game.actionLog) {
    return <div className="loading-screen">Подключение к лобби {gameCode}...</div>;
  }

  const isHost = game.hostId === socketId;
  const currentPlayer = game.players.find(p => p.id === socketId);
  const hasSubmittedCharacter = currentPlayer && currentPlayer.characterSubmitted;
  const allPlayersSubmitted = game.players.every(p => p.characterSubmitted);

  const handleCharacterSubmit = () => {
    if (characterInput.trim()) {
      onSubmitCharacter(characterInput.trim());
      setCharacterInput('');
    }
  };

  return (
    <div className="glass-panel">
      <div className="room-header">
        <h1 className="room-title">Лобби игры: {game.code}</h1>
        <p className="room-info">Вы: {playerName || 'Наблюдатель'} {isHost && '(Хост)'}</p>
      </div>
      <div className="room-layout">
        <div className="main-content">
          <div className="players-section glass-panel">
            <h2>Игроки ({game.players.length})</h2>
            <div className="player-list">
              {game.players.map((player) => (
                <PlayerCard key={player.id} player={player} isSelf={player.id === socketId} />
              ))}
            </div>
          </div>
          <div className="character-submission-section glass-panel">
            <h2>Загадайте персонажа</h2>
            {!hasSubmittedCharacter ? (
              <div className="input-group">
                <input
                  type="text"
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  placeholder="Например: Бэтмен, Гарри Поттер"
                  maxLength="30"
                />
                <button onClick={handleCharacterSubmit} className="btn primary">
                  Загадать
                </button>
              </div>
            ) : (
              <p className="submitted-message">Вы загадали персонажа! Ожидаем других.</p>
            )}
          </div>
          {isHost && (
            <div className="start-game-section">
              <button
                onClick={onStartGame}
                className="btn success"
                disabled={!allPlayersSubmitted || game.players.length < 2}
                title={
                  game.players.length < 2
                  ? "Нужно минимум 2 игрока"
                  : !allPlayersSubmitted
                  ? "Не все игроки загадали персонажа"
                  : "Начать игру"
                }
              >
                Начать игру
              </button>
              {game.players.length < 2 && <p className="waiting-message">Нужно минимум 2 игрока для начала.</p>}
              {!allPlayersSubmitted && game.players.length >= 2 && <p className="waiting-message">Ожидаем, пока все загадают персонажей...</p>}
            </div>
          )}
        </div>
        <div className="history-panel glass-panel">
          <HistoryLog events={game.actionLog} />
        </div>
        <div className="exit-button-container">
            <button onClick={onLeaveGame} className="btn danger">Выйти из игры</button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;