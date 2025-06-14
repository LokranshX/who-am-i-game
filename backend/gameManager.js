// backend/gameManager.js

const { v4: uuidv4 } = require('uuid');

class GameManager {
    constructor() {
        this.activeGames = {};
    }

    generateGameCode() {
        let code;
        do {
            code = Math.random().toString(36).substring(2, 7).toUpperCase();
        } while (this.activeGames[code]);
        return code;
    }

    createGame(hostSocketId, hostName) {
        const player = {
            id: hostSocketId,
            name: hostName,
            isHost: true,
            characterSubmitted: null,
            characterOnForehead: null,
            guessed: false,
            questionsAskedInTurn: 0
        };
        const gameCode = this.generateGameCode();
        this.activeGames[gameCode] = {
            code: gameCode,
            players: [player],
            status: 'waiting',
            hostId: hostSocketId,
            currentPlayerIndex: 0,
            maxQuestionsPerTurn: 3,
            chatMessages: [],
            charactersPool: [],
            turnStartTime: null
        };
        this.addChatMessage(gameCode, 'system', `${hostName} создал игру.`);
        return this.activeGames[gameCode];
    }

    joinGame(gameCode, playerSocketId, playerName) {
        const game = this.activeGames[gameCode];
        if (!game) throw new Error('Игра не найдена.');
        if (game.status !== 'waiting') throw new Error('Игра уже началась или завершена.');
        if (game.players.find(p => p.id === playerSocketId)) throw new Error('Вы уже в этой игре.');

        const player = {
            id: playerSocketId,
            name: playerName,
            isHost: false,
            characterSubmitted: null,
            characterOnForehead: null,
            guessed: false,
            questionsAskedInTurn: 0
        };
        game.players.push(player);
        this.addChatMessage(gameCode, 'system', `${playerName} присоединился к игре.`);
        return game;
    }

    leaveGame(playerSocketId) {
        for (const gameCode in this.activeGames) {
            const game = this.activeGames[gameCode];
            const playerIndex = game.players.findIndex(p => p.id === playerSocketId);

            if (playerIndex !== -1) {
                const playerName = game.players[playerIndex].name;
                game.players.splice(playerIndex, 1);
                this.addChatMessage(gameCode, 'system', `${playerName} покинул игру.`);

                if (game.hostId === playerSocketId) {
                    if (game.players.length > 0) {
                        game.hostId = game.players[0].id;
                        game.players[0].isHost = true;
                        this.addChatMessage(gameCode, 'system', `${game.players[0].name} стал новым хостом.`);
                    } else {
                        delete this.activeGames[gameCode];
                        console.log(`Игра ${gameCode} удалена, так как все игроки покинули ее.`);
                        return null;
                    }
                }

                if (game.status === 'in-progress' && game.players.length < 2) {
                    this.endGame(gameCode, 'Недостаточно игроков для продолжения.');
                    return null;
                }

                if (game.status === 'in-progress' && game.currentPlayerIndex === playerIndex) {
                    this.nextTurn(gameCode);
                } else if (game.status === 'in-progress' && game.currentPlayerIndex > playerIndex) {
                    game.currentPlayerIndex--;
                }
                return game;
            }
        }
        return null;
    }

    getGame(gameCode) {
        return this.activeGames[gameCode];
    }

    getPublicGames() {
        return Object.values(this.activeGames)
            .filter(game => game.status === 'waiting')
            .map(game => ({
                code: game.code,
                playersCount: game.players.length,
                hostName: game.players.find(p => p.isHost)?.name || 'Неизвестно'
            }));
    }

    addChatMessage(gameCode, sender, message) {
        const game = this.activeGames[gameCode];
        if (game) {
            game.chatMessages.push({
                id: uuidv4(),
                sender: sender,
                message: message,
                timestamp: Date.now()
            });
            if (game.chatMessages.length > 100) {
                game.chatMessages.splice(0, game.chatMessages.length - 100);
            }
        }
    }

    submitCharacter(gameCode, playerSocketId, characterName) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'waiting') throw new Error('Невозможно загадать персонажа в текущем состоянии игры.');
        const player = game.players.find(p => p.id === playerSocketId);
        if (player) {
            player.characterSubmitted = characterName.trim();
            this.addChatMessage(gameCode, 'system', `${player.name} загадал персонажа.`);
        }
        return game;
    }

    startGame(gameCode) {
        const game = this.activeGames[gameCode];
        if (!game) throw new Error('Игра не найдена.');
        if (game.players.length < 2) throw new Error('Для начала игры нужно минимум 2 игрока.');
        if (game.players.some(p => !p.characterSubmitted)) throw new Error('Все игроки должны загадать персонажей перед началом игры.');

        game.status = 'in-progress';
        game.charactersPool = game.players.map(p => p.characterSubmitted);

        const shuffledCharacters = [...game.charactersPool].sort(() => Math.random() - 0.5);
        game.players.forEach((player, index) => {
            let assignedCharacter;
            let attempts = 0;
            do {
                assignedCharacter = shuffledCharacters[(index + attempts) % shuffledCharacters.length];
                attempts++;
            // ИЗМЕНЕНИЕ ЗДЕСЬ: Сравниваем в нижнем регистре
            } while (assignedCharacter.toLowerCase() === player.characterSubmitted.toLowerCase() && attempts <= shuffledCharacters.length);

            player.characterOnForehead = assignedCharacter;
        });

        game.currentPlayerIndex = Math.floor(Math.random() * game.players.length);
        game.turnStartTime = Date.now();
        this.addChatMessage(gameCode, 'system', 'Игра началась! Удачи!');
        this.addChatMessage(gameCode, 'system', `Первый ход у ${game.players[game.currentPlayerIndex].name}.`);
        return game;
    }

    askQuestion(gameCode, playerSocketId, question) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'in-progress') throw new Error('Игра не в процессе.');
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerSocketId) throw new Error('Сейчас не ваш ход.');
        if (currentPlayer.questionsAskedInTurn >= game.maxQuestionsPerTurn) throw new Error(`Вы задали максимальное количество вопросов (${game.maxQuestionsPerTurn}) за этот ход.`);

        this.addChatMessage(gameCode, currentPlayer.name, question);
        return game;
    }

    answerQuestion(gameCode, playerSocketId, answer) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'in-progress') throw new Error('Игра не в процессе.');

        const currentPlayer = game.players[game.currentPlayerIndex];
        const characterOnForeheadOfCurrentPlayer = currentPlayer.characterOnForehead;

        // ИЗМЕНЕНИЕ ЗДЕСЬ: Ищем владельца персонажа, сравнивая в нижнем регистре
        const playerWhoOwnsCharacter = game.players.find(p => p.characterSubmitted.toLowerCase() === characterOnForeheadOfCurrentPlayer.toLowerCase());

        if (!playerWhoOwnsCharacter || playerWhoOwnsCharacter.id !== playerSocketId) {
            throw new Error('Вы не можете ответить на этот вопрос. Отвечает тот, кто загадал персонажа, который сейчас на лбу у спрашивающего.');
        }

        this.addChatMessage(gameCode, playerWhoOwnsCharacter.name, answer ? 'Да' : 'Нет');

        if (!answer) {
            this.nextTurn(gameCode);
        } else {
            currentPlayer.questionsAskedInTurn++;
            if (currentPlayer.questionsAskedInTurn >= game.maxQuestionsPerTurn) {
                this.addChatMessage(gameCode, 'system', `${currentPlayer.name} задал максимальное количество вопросов. Ход переходит.`);
                this.nextTurn(gameCode);
            }
        }
        return game;
    }

    makeGuess(gameCode, playerSocketId, guess) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'in-progress') throw new Error('Игра не в процессе.');
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerSocketId) throw new Error('Сейчас не ваш ход.');

        const correctCharacter = currentPlayer.characterOnForehead;
        // ЭТА ЧАСТЬ УЖЕ РАБОТАЛА ПРАВИЛЬНО: Сравниваем в нижнем регистре
        const isCorrect = guess.trim().toLowerCase() === correctCharacter.toLowerCase();

        if (isCorrect) {
            currentPlayer.guessed = true;
            this.addChatMessage(gameCode, 'system', `${currentPlayer.name} угадал своего персонажа: "${correctCharacter}"!`);
            this.endGame(gameCode, `${currentPlayer.name} победил!`);
        } else {
            this.addChatMessage(gameCode, 'system', `${currentPlayer.name} попытался угадать "${guess}", но это неверно.`);
            this.nextTurn(gameCode);
        }
        return game;
    }

    nextTurn(gameCode) {
        const game = this.activeGames[gameCode];
        if (!game) return;

        game.players[game.currentPlayerIndex].questionsAskedInTurn = 0;

        let nextPlayerFound = false;
        let attempts = 0;
        while (!nextPlayerFound && attempts < game.players.length) {
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
            if (!game.players[game.currentPlayerIndex].guessed) {
                nextPlayerFound = true;
            }
            attempts++;
        }

        if (!nextPlayerFound) {
            this.endGame(gameCode, 'Все игроки угадали своих персонажей!');
            return;
        }

        game.turnStartTime = Date.now();
        this.addChatMessage(gameCode, 'system', `Ход перешел к ${game.players[game.currentPlayerIndex].name}.`);
        return game;
    }

    endGame(gameCode, message) {
        const game = this.activeGames[gameCode];
        if (game) {
            game.status = 'finished';
            this.addChatMessage(gameCode, 'system', `Игра завершена: ${message}`);
            setTimeout(() => {
                delete this.activeGames[gameCode];
                console.log(`Игра ${gameCode} удалена из памяти.`);
            }, 30000);
        }
    }
}

module.exports = new GameManager();