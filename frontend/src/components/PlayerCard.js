// frontend/src/components/PlayerCard.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

// --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
// Мы получаем флаг isSelf, а не isCurrentPlayer и characterOnForehead
function PlayerCard({ player, isSelf, isTurn }) {
  const cardClass = `player-card ${isSelf ? 'current-player' : ''} ${isTurn ? 'active-turn' : ''} ${player.guessed ? 'guessed' : ''}`;

  return (
    <div className={cardClass}>
      <div className="player-avatar"></div>
      <div className="player-name-container">
        <h3 className="player-name">{player.name}</h3>
        {/* Иконка готовности в лобби, логика остается */}
        {player.characterSubmitted && !player.characterOnForehead && !player.guessed && (
          <FontAwesomeIcon icon={faCheckCircle} className="ready-icon" title="Персонаж загадан" />
        )}
      </div>
      
      {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
      {/* Показываем персонажа, если это НЕ наша карточка (isSelf === false) */}
      {!isSelf && player.characterOnForehead && (
        <div className="character-display" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '10px' }}>
          <span className="character-name" style={{ fontWeight: '700', color: 'var(--text-light)' }}>
            {player.characterOnForehead}
          </span>
        </div>
      )}

      {player.guessed && <span className="guessed-badge">Угадал!</span>}
    </div>
  );
}

export default PlayerCard;