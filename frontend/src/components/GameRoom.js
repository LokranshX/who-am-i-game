// frontend/src/components/GameRoom.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerCard from './PlayerCard';
import HistoryLog from './HistoryLog';

function GameRoom({ game, playerName, socketId, onAskQuestion, onAnswerQuestion, onMakeGuess, onLeaveGame }) {
  const [questionInput, setQuestionInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (game && game.status === 'waiting') {
      navigate(`/lobby/${game.code}`);
    }
  }, [game, navigate]);

  // --- ВОТ ИСПРАВЛЕНИЕ ---
  if (!game) {
    return <div className="loading-screen">Загрузка игровой комнаты...</div>;
  }

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === socketId;
  const myPlayer = game.players.find(p => p.id === socketId);
  const hasGuessed = myPlayer?.guessed;

  const lastAction = game.actionLog.length > 0 ? game.actionLog[game.actionLog.length - 1] : null;
  const isQuestionPending = lastAction && lastAction.type === 'question';

  const handleAskQuestion = () => {
    if (questionInput.trim() && isMyTurn && !hasGuessed) {
      onAskQuestion(questionInput.trim());
      setQuestionInput('');
    }
  };

  const handleMakeGuess = () => {
    if (guessInput.trim() && isMyTurn && !hasGuessed) {
      onMakeGuess(guessInput.trim());
      setGuessInput('');
    }
  };

  const renderActionSection = () => {
    if (game.status !== 'in-progress') return null;
    if (hasGuessed) {
      return <p className="submitted-message glass-panel" style={{textAlign: 'center', padding: '20px'}}>Вы уже угадали! Ожидаем других.</p>;
    }

    if (isMyTurn) {
      return (
        <div>
          <h3>Ваш ход! Угадайте, кто вы.</h3>
          <p>Осталось вопросов: {game.maxQuestionsPerTurn - (myPlayer?.questionsAskedInTurn || 0)}</p>
          <div className="input-group">
            <input type="text" value={questionInput} onChange={(e) => setQuestionInput(e.target.value)} placeholder="Задайте вопрос (да/нет)" disabled={myPlayer?.questionsAskedInTurn >= game.maxQuestionsPerTurn} maxLength="100" />
            <button onClick={handleAskQuestion} className="btn primary" disabled={myPlayer?.questionsAskedInTurn >= game.maxQuestionsPerTurn}>Спросить</button>
          </div>
          <div className="input-group">
            <input type="text" value={guessInput} onChange={(e) => setGuessInput(e.target.value)} placeholder="Попытка угадать персонажа" maxLength="30" />
            <button onClick={handleMakeGuess} className="btn secondary">Угадать!</button>
          </div>
        </div>
      );
    }

    if (isQuestionPending) {
        const characterOwner = game.players.find(p => p.characterSubmitted.toLowerCase() === currentPlayer.characterOnForehead.toLowerCase());
        if (characterOwner && characterOwner.id === socketId) {
            return (
                <div>
                  <h3>Ответьте на вопрос от {currentPlayer.name}:</h3>
                  <p>"{lastAction.text}"</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button onClick={() => onAnswerQuestion(true)} className="btn success">Да</button>
                    <button onClick={() => onAnswerQuestion(false)} className="btn danger">Нет</button>
                  </div>
                </div>
            );
        }
    }

    return <h3>Ожидайте своего хода...</h3>;
  };

  return (
    <div className="glass-panel">
      <div className="room-header">
        <h1 className="room-title">Игра: {game.code}</h1>
        <p className="room-info">
          {game.status === 'in-progress' ? `Ход игрока: ${currentPlayer?.name}` : 'Игра завершена!'}
        </p>
      </div>

      <div className="room-layout">
        <div className="main-content">
          <div className="players-display glass-panel">
            {game.players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isSelf={player.id === socketId}
                isTurn={player.id === currentPlayer?.id}
              />
            ))}
          </div>

          <div className="action-section glass-panel">
            {renderActionSection()}
          </div>

          {game.status === 'finished' && (
            <div className="game-over-section glass-panel" style={{textAlign: 'center'}}>
              <h2>Игра завершена!</h2>
              <p>Победитель: {game.players.find(p => p.guessed)?.name || 'Неизвестно'}</p>
              <h3>Итоги:</h3>
              <ul style={{listStyle: 'none', padding: 0}}>
                {game.players.map(p => (
                  <li key={p.id}>{p.name} был персонажем: <strong>{p.characterOnForehead}</strong></li>
                ))}
              </ul>
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

export default GameRoom;