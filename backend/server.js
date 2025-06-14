// backend/server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const gameManager = require('./gameManager'); // Наш менеджер игр

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000", // Разрешаем запросы с фронтенда
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware для Express (если понадобится для статики или API, но для этой игры не обязательно)
app.use(express.json());

// Socket.IO логика
io.on('connection', (socket) => {
    console.log(`Пользователь подключился: ${socket.id}`);

    // Отправляет обновленное состояние игры всем в комнате
    const emitGameUpdate = (gameCode) => {
        const game = gameManager.getGame(gameCode);
        if (game) {
            // Отправляем каждому игроку его персонажа на лбу при старте
            if (game.status === 'in-progress') {
                game.players.forEach(p => {
                    io.to(p.id).emit('characterAssigned', p.characterOnForehead);
                });
            }
            // Отправляем общее состояние игры (без персонажей на лбу)
            const publicGameData = {
                ...game,
                players: game.players.map(p => ({
                    id: p.id,
                    name: p.name,
                    isHost: p.isHost,
                    guessed: p.guessed,
                    characterSubmitted: !!p.characterSubmitted, // Отправляем только факт, а не самого персонажа
                }))
            };
            io.to(gameCode).emit('gameUpdate', publicGameData);
        } else {
            // Если игра удалена, сообщаем клиентам
            io.to(gameCode).emit('gameEnded', 'Игра завершена или удалена.');
        }
    };

    // Создание игры
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

    // Присоединение к игре
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

    // Получение списка публичных игр
    socket.on('getPublicGames', () => {
        socket.emit('publicGamesList', gameManager.getPublicGames());
    });

    // Игрок загадывает персонажа
    socket.on('submitCharacter', (gameCode, characterName) => {
        try {
            const game = gameManager.submitCharacter(gameCode, socket.id, characterName);
            emitGameUpdate(game.code);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    // Хост начинает игру
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

    // Игрок задает вопрос
    socket.on('askQuestion', (gameCode, question) => {
        try {
            gameManager.askQuestion(gameCode, socket.id, question);
            emitGameUpdate(gameCode);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    // Игрок отвечает на вопрос
    socket.on('answerQuestion', (gameCode, answer) => {
        try {
            gameManager.answerQuestion(gameCode, socket.id, answer);
            emitGameUpdate(gameCode);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    // Игрок делает попытку угадать
    socket.on('makeGuess', (gameCode, guess) => {
        try {
            gameManager.makeGuess(gameCode, socket.id, guess);
            emitGameUpdate(gameCode);
        } catch (error) {
            socket.emit('gameError', error.message);
        }
    });

    // Чат
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

    // --- НОВЫЙ ОБРАБОТЧИК ---
    // Игрок добровольно покидает игру
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


    // Отключение пользователя (при закрытии вкладки)
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