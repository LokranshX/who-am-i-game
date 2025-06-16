// frontend/src/components/Home.js
import React, { useState } from 'react';
import logo from '../images/logo.png';

// Создаем массив путей к аватаркам
const avatars = Array.from({ length: 10 }, (_, i) => `/who-am-i-game/avatars/avatar${i + 1}.png`);

function Home({ onCreateGame, onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [joinGameCode, setJoinGameCode] = useState('');
  // Состояние для выбранной аватарки, по умолчанию первая
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  const handleCreate = () => {
    if (playerName.trim()) {
      // Передаем объект с именем и аватаркой
      onCreateGame({ name: playerName.trim(), avatarId: selectedAvatar });
    } else {
      alert('Пожалуйста, введите ваше имя.');
    }
  };

  const handleJoin = () => {
    if (playerName.trim() && joinGameCode.trim()) {
      // Передаем объект с именем и аватаркой
      onJoinGame(joinGameCode.trim().toUpperCase(), { name: playerName.trim(), avatarId: selectedAvatar });
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

      {/* --- НОВЫЙ БЛОК: ВЫБОР АВАТАРКИ --- */}
      <div className="avatar-selection-container">
        <h3>Выберите аватарку:</h3>
        <div className="avatar-grid">
          {avatars.map((avatarSrc) => (
            <div
              key={avatarSrc}
              className={`avatar-option ${selectedAvatar === avatarSrc ? 'selected' : ''}`}
              onClick={() => setSelectedAvatar(avatarSrc)}
            >
              <img src={avatarSrc} alt={`Аватар ${avatarSrc}`} />
            </div>
          ))}
        </div>
      </div>
      {/* --- КОНЕЦ НОВОГО БЛОКА --- */}

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