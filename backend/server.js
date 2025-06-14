// backend/server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameManager = require('./gameManager');

// --- ШАГ 1: Импортируем cors ---
const cors = require('cors');

const app = express();

// --- ШАГ 2: Настраиваем CORS для Express ---
// Это более надежный способ, чем передавать его в Socket.IO
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"]
};
app.use(cors(corsOptions));


const server = http.createServer(app);

// --- ШАГ 3: Упрощаем инициализацию Socket.IO ---
// Теперь Socket.IO будет наследовать CORS-политику от Express
const io = new Server(server, {
    cors: corsOptions // Мы все еще передаем опции сюда для совместимости
});

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Socket.IO логика остается без изменений
io.on('connection', (socket) => {
    console.log(`Пользователь подключился: ${socket.id}`);

    const emitGameUpdate = (gameCode) => {
        const game = gameManager.getGame(gameCode);
        if (game) {
            if (game.status === 'in-progress') {
                game.players.forEach(p => {
                    io.to(p.id).emit('characterAssigned', p.characterOnForehead);
                });
            }
            const publicGameData = {
                ...game,
                players: game.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost,
                    guessed: p.guessed,
                    characterSubmitted: !!p.characterSubmitted,
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
            console.log(`Игра ${game.code} создана хостом ${playerName} (${socket.id})`);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('joinGame', (gameCode, playerName) => {
        try {
            const game = gameManager.joinGame(gameCode, socket.id, playerName);
            socket.join(game.code);
            emitGameUpdate(game.code);
            console.log(`${playerName} (${socket.id}) присоединился к игре ${game.code}`);
        } catch (error) {
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
        } catch (error) => {
            socket.emit('gameError', error.message);
        }
    });

    socket.on('startGame', (gameCode) => {
        try {
            const game = gameManager.getGame(gameCode);
            if (game && game.hostId === socket.id) {
                gameManager.startGame(gameCode);
                emitGameUpdate(game.code);
                console.log(`Игра ${game.code} началась.`);
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

    socket.on('chatMessage', (gameCode, message) => {
        const game = gameManager.getGame(gameCode);
        if (game) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                gameManager.addChatMessage(gameCode, player.name, message);
                emitGameUpdate(gameCode);
            }
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

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});