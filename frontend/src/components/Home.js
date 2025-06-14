import React, { useState } from 'react';
import logo from '../images/logo.png';

function Home({ onCreateGame, onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [joinGameCode, setJoinGameCode] = useState('');

  const handleCreate = () => {
    if (playerName.trim()) {
      onCreateGame(playerName.trim());
    } else {
      alert('Пожалуйста, введите ваше имя.');
    }
  };

  const handleJoin = () => {
    if (playerName.trim() && joinGameCode.trim()) {
      onJoinGame(joinGameCode.trim().toUpperCase(), playerName.trim());
    } else {
      alert('Пожалуйста, введите ваше имя и код игры.');
    }
  };

  return (
    <div className="home-container glass-panel">
      <img src={logo} alt="Логотип игры Кто Я?" className="game-logo" />
      
      <p className="game-description">
        Угадай персонажа, имя которого написано у тебя на лбу, задавая вопросы другим игрокам!
      </p>

      <div className="input-group">
        <label htmlFor="playerName">Ваше имя:</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Введите ваше имя"
          maxLength="15"
        />
      </div>

      <div className="button-group">
        <button onClick={handleCreate} className="btn primary">
          Создать новую игру
        </button>
      </div>

      <div className="join-game-section">
        <h2>Присоединиться к игре</h2>
        <div className="input-group">
          <label htmlFor="joinGameCode">Код игры:</label>
          <input
            id="joinGameCode"
            type="text"
            value={joinGameCode}
            onChange={(e) => setJoinGameCode(e.target.value)}
            placeholder="Введите код игры"
            maxLength="5"
          />
        </div>
        <button onClick={handleJoin} className="btn secondary">
          Присоединиться
        </button>
      </div>
    </div>
  );
}

export default Home;