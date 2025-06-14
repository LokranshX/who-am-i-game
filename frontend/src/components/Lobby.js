// frontend/src/components/Lobby.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import Chat from './Chat';

function Lobby({ game, playerName, socketId, onStartGame, onSubmitCharacter, onChatMessage, onLeaveGame }) {
  const [characterInput, setCharacterInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (game && game.status === 'in-progress') {
      navigate(`/game/${game.code}`);
    }
  }, [game, navigate]);

  if (!game) {
    return <div className="loading-screen">Загрузка лобби...</div>;
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
    // Это главный контейнер для всего экрана лобби
    <div className="glass-panel">
      
      {/* --- Секция 1: Заголовок --- */}
      <div className="room-header">
        <h1 className="room-title">Лобби игры: {game.code}</h1>
        <p className="room-info">Вы: {playerName} {isHost && '(Хост)'}</p>
      </div>

      {/* --- Секция 2: Основной макет (сетка из 2 колонок) --- */}
      {/* Вот тот самый div, который создает сетку */}
      <div className="room-layout">
        
        {/* --- Левая колонка --- */}
        <div className="main-content">
          
          <div className="players-section glass-panel">
            <h2>Игроки ({game.players.length})</h2>
            <div className="player-list">
              {game.players.map((player) => (
                <PlayerCard key={player.id} player={player} isCurrentPlayer={player.id === socketId} />
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

        {/* --- Правая колонка (Чат) --- */}
        {/* Панель чата теперь является прямым дочерним элементом .room-layout */}
        <div className="chat-panel glass-panel">
          <Chat messages={game.chatMessages} onSendMessage={onChatMessage} />
        </div>

        {/* --- Секция 3: Кнопка выхода (под сеткой) --- */}
        {/* Эта кнопка также является дочерним элементом .room-layout, чтобы CSS мог ее правильно расположить */}
        <div className="exit-button-container">
            <button onClick={onLeaveGame} className="btn danger">Выйти из игры</button>
        </div>

      </div>
    </div>
  );
}

export default Lobby;