// frontend/src/components/PlayerCard.js
import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

function PlayerCard({ player, isSelf, isTurn }) {
  const cardClass = `player-card ${isTurn ? 'active-turn' : ''} ${player.guessed ? 'guessed' : ''}`;

  return (
    <div className={cardClass}>
      {/* --- ИЗМЕНЕНИЕ ЗДЕСЬ --- */}
      <div className="player-avatar">
        <img src={player.avatarId} alt={player.name} className="player-avatar-img" />
      </div>
      
      <div className="player-name-container">
        <h3 className="player-name">{player.name}</h3>
        {player.characterSubmitted && !player.characterOnForehead && !player.guessed && (
          <FontAwesomeIcon icon={faCheckCircle} className="ready-icon" title="Персонаж загадан" />
        )}
      </div>
      
      {!isSelf && player.characterOnForehead && (
        <div className="character-display">
          <span className="character-name">
            {player.characterOnForehead}
          </span>
        </div>
      )}

      {player.guessed && <span className="guessed-badge">Угадал!</span>}
    </div>
  );
}

export default memo(PlayerCard);