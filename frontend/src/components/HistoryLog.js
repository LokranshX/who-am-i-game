// frontend/src/components/HistoryLog.js
import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faCheck, faTimes, faBullseye, faSignInAlt, faSignOutAlt, faUserCheck, faGamepad } from '@fortawesome/free-solid-svg-icons';

function HistoryLog({ events }) {
  const eventsEndRef = useRef(null);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const renderEvent = (event) => {
    switch (event.type) {
      case 'system':
        return <><FontAwesomeIcon icon={faGamepad} /> <span>{event.text}</span></>;
      case 'join':
        return <><FontAwesomeIcon icon={faSignInAlt} /> <strong>{event.playerName}</strong> присоединился к игре.</>;
      case 'leave':
        return <><FontAwesomeIcon icon={faSignOutAlt} /> <strong>{event.playerName}</strong> покинул игру.</>;
      case 'submit':
        return <><FontAwesomeIcon icon={faUserCheck} /> <strong>{event.playerName}</strong> загадал персонажа.</>;
      case 'question':
        return <><FontAwesomeIcon icon={faQuestionCircle} /> <span><strong>{event.playerName}</strong> спросил: "{event.text}"</span></>;
      case 'answer':
        return <><FontAwesomeIcon icon={event.answer === 'Да' ? faCheck : faTimes} className={event.answer === 'Да' ? 'icon-yes' : 'icon-no'} /> <span><strong>{event.playerName}</strong> ответил: <strong>{event.answer}</strong></span></>;
      case 'guess':
        return <><FontAwesomeIcon icon={faBullseye} /> <span><strong>{event.playerName}</strong> угадывает: "{event.text}" - {event.isCorrect ? <strong className="correct-guess">Верно!</strong> : 'Неверно.'}</span></>;
      default:
        return <span>Неизвестное действие.</span>;
    }
  };

  return (
    <div className="history-log-container">
      <h3>История игры</h3>
      <div className="history-events">
        {events.map((event) => (
          <div key={event.id} className={`history-event event-type-${event.type}`}>
            {renderEvent(event)}
          </div>
        ))}
        <div ref={eventsEndRef} />
      </div>
    </div>
  );
}

export default HistoryLog;