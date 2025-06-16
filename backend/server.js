// backend/server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameManager = require('./gameManager');
const cors = require('cors');

const app = express();

// --- ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ---
// Мы создаем список разрешенных адресов
const allowedOrigins = [
  'http://localhost:3000', // Для локальной разработки
  'https://lokranshx.github.io' // Ваш опубликованный сайт
];

const corsOptions = {
  origin: function (origin, callback) {
    // Если запрос приходит с одного из разрешенных адресов (или это не браузерный запрос), разрешаем его
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"]
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
    cors: corsOptions // Применяем те же опции для Socket.IO
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

io.on('connection', (socket) => {
    console.log(`Пользователь подключился: ${socket.id}`);

    const emitGameUpdate = (gameCode) => {
        const game = gameManager.getGame(gameCode);
        if (game) {
            const publicGameData = {
                ...game,
                players: game.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost,
                    guessed: p.guessed,
                    characterSubmitted: !!p.characterSubmitted,
                    characterOnForehead: p.characterOnForehead,
                    questionsAskedInTurn: p.questionsAskedInTurn
                }))
            };
            io.to(gameCode).emit('gameUpdate', publicGameData);
        } else {
            io.to(gameCode).emit('gameEnded', 'Игра завершена или удалена.');
        }
    };

    socket.on('createGame', (playerName) => {
        try {
            const game = gameManager.createGame(socket.id, playerName);
            socket.join(game.code);
            socket.emit('gameCreated', game.code);
            emitGameUpdate(game.code);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('joinGame', (gameCode, playerName) => {
        try {
            const game = gameManager.joinGame(gameCode, socket.id, playerName);
            socket.join(game.code);
            emitGameUpdate(game.code);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('getGame', (gameCode) => {
        try {
            socket.join(gameCode);
            const game = gameManager.getGame(gameCode);
            if (game) {
                emitGameUpdate(gameCode);
            } else {
                socket.emit('gameError', 'Игра, к которой вы пытаетесь подключиться, не найдена.');
            }
        } catch(error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('getPublicGames', () => {
        socket.emit('publicGamesList', gameManager.getPublicGames());
    });

    socket.on('submitCharacter', (gameCode, characterName) => {
        try {
            const game = gameManager.submitCharacter(gameCode, socket.id, characterName);
            emitGameUpdate(game.code);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('startGame', (gameCode) => {
        try {
            const game = gameManager.getGame(gameCode);
            if (game && game.hostId === socket.id) {
                gameManager.startGame(gameCode);
                emitGameUpdate(game.code);
            } else {
                socket.emit('gameError', 'Только хост может начать игру.');
            }
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('askQuestion', (gameCode, question) => {
        try {
            gameManager.askQuestion(gameCode, socket.id, question);
            emitGameUpdate(gameCode);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('answerQuestion', (gameCode, answer) => {
        try {
            gameManager.answerQuestion(gameCode, socket.id, answer);
            emitGameUpdate(gameCode);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('makeGuess', (gameCode, guess) => {
        try {
            gameManager.makeGuess(gameCode, socket.id, guess);
            emitGameUpdate(gameCode);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('leaveGame', (gameCode) => {
        try {
            socket.leave(gameCode);
            const game = gameManager.leaveGame(socket.id);
            if (game) {
                emitGameUpdate(game.code);
            }
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Пользователь отключился: ${socket.id}`);
        const game = gameManager.leaveGame(socket.id);
        if (game) {
            emitGameUpdate(game.code);
        }
    });
});

const PORT = process.env.PORT || 5000; 

server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});