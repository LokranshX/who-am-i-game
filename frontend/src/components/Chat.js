// frontend/src/components/Chat.js
import React, { useState, useEffect, useRef } from 'react';

// Убираем chatEndRef из пропсов, компонент теперь сам управляет прокруткой
function Chat({ messages, onSendMessage }) {
  const [messageInput, setMessageInput] = useState('');
  // Создаем ref прямо здесь
  const messagesEndRef = useRef(null);

  // Функция для плавной прокрутки вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Вызываем прокрутку каждый раз, когда обновляется массив сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSend = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    // Этот div теперь является основным flex-контейнером для чата
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender === 'system' ? 'system-message' : ''}`}>
            <span className="message-sender">{msg.sender}:</span>
            <span className="message-text">{msg.message}</span>
          </div>
        ))}
        {/* Пустой div в конце, к которому мы будем прокручивать */}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-group">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Напишите сообщение..."
          maxLength="150"
        />
        <button onClick={handleSend} className="btn primary">
          Отправить
        </button>
      </div>
    </div>
  );
}

export default Chat;