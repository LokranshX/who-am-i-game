// frontend/src/components/PlayerCard.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

function PlayerCard({ player, isCurrentPlayer, isTurn, characterOnForehead }) {
  const cardClass = `player-card ${isCurrentPlayer ? 'current-player' : ''} ${isTurn ? 'active-turn' : ''} ${player.guessed ? 'guessed' : ''}`;

  return (
    <div className={cardClass}>
      <div className="player-avatar"></div>
      <div className="player-name-container">
        <h3 className="player-name">{player.name}</h3>
        {player.characterSubmitted && !characterOnForehead && !player.guessed && (
          <FontAwesomeIcon icon={faCheckCircle} className="ready-icon" title="Персонаж загадан" />
        )}
      </div>
      {isCurrentPlayer && characterOnForehead && (
        <div className="character-display" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '10px' }}>
          <span className="character-name" style={{ fontWeight: '700', color: 'var(--text-light)' }}>
            {characterOnForehead}
          </span>
        </div>
      )}
      {player.guessed && <span className="guessed-badge">Угадал!</span>}
    </div>
  );
}

export default PlayerCard;