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

    // Новый метод для логирования структурированных действий
    logGameAction(gameCode, action) {
        const game = this.activeGames[gameCode];
        if (game) {
            const logEntry = { ...action, id: uuidv4(), timestamp: Date.now() };
            game.actionLog.push(logEntry);
            if (game.actionLog.length > 100) {
                game.actionLog.splice(0, game.actionLog.length - 100);
            }
        }
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
            actionLog: [], // Заменили chatMessages на actionLog
            charactersPool: [],
            turnStartTime: null
        };
        this.logGameAction(gameCode, { type: 'system', text: `${hostName} создал игру.` });
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
        this.logGameAction(gameCode, { type: 'join', playerName });
        return game;
    }

    leaveGame(playerSocketId) {
        for (const gameCode in this.activeGames) {
            const game = this.activeGames[gameCode];
            const playerIndex = game.players.findIndex(p => p.id === playerSocketId);

            if (playerIndex !== -1) {
                const playerName = game.players[playerIndex].name;
                game.players.splice(playerIndex, 1);
                this.logGameAction(gameCode, { type: 'leave', playerName });

                if (game.hostId === playerSocketId) {
                    if (game.players.length > 0) {
                        game.hostId = game.players[0].id;
                        game.players[0].isHost = true;
                        this.logGameAction(gameCode, { type: 'system', text: `${game.players[0].name} стал новым хостом.` });
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

    submitCharacter(gameCode, playerSocketId, characterName) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'waiting') throw new Error('Невозможно загадать персонажа в текущем состоянии игры.');
        const player = game.players.find(p => p.id === playerSocketId);
        if (player) {
            player.characterSubmitted = characterName.trim();
            this.logGameAction(gameCode, { type: 'submit', playerName: player.name });
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
            } while (assignedCharacter.toLowerCase() === player.characterSubmitted.toLowerCase() && attempts <= shuffledCharacters.length);

            player.characterOnForehead = assignedCharacter;
        });

        game.currentPlayerIndex = Math.floor(Math.random() * game.players.length);
        game.turnStartTime = Date.now();
        this.logGameAction(gameCode, { type: 'system', text: 'Игра началась! Удачи!' });
        this.logGameAction(gameCode, { type: 'system', text: `Первый ход у ${game.players[game.currentPlayerIndex].name}.` });
        return game;
    }

    askQuestion(gameCode, playerSocketId, question) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'in-progress') throw new Error('Игра не в процессе.');
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.id !== playerSocketId) throw new Error('Сейчас не ваш ход.');
        if (currentPlayer.questionsAskedInTurn >= game.maxQuestionsPerTurn) throw new Error(`Вы задали максимальное количество вопросов (${game.maxQuestionsPerTurn}) за этот ход.`);

        this.logGameAction(gameCode, { type: 'question', playerName: currentPlayer.name, text: question });
        return game;
    }

    answerQuestion(gameCode, playerSocketId, answer) {
        const game = this.activeGames[gameCode];
        if (!game || game.status !== 'in-progress') throw new Error('Игра не в процессе.');

        const currentPlayer = game.players[game.currentPlayerIndex];
        const characterOnForeheadOfCurrentPlayer = currentPlayer.characterOnForehead;

        const playerWhoOwnsCharacter = game.players.find(p => p.characterSubmitted.toLowerCase() === characterOnForeheadOfCurrentPlayer.toLowerCase());

        if (!playerWhoOwnsCharacter || playerWhoOwnsCharacter.id !== playerSocketId) {
            throw new Error('Вы не можете ответить на этот вопрос.');
        }

        this.logGameAction(gameCode, { type: 'answer', playerName: playerWhoOwnsCharacter.name, answer: answer ? 'Да' : 'Нет' });

        if (!answer) {
            this.nextTurn(gameCode);
        } else {
            currentPlayer.questionsAskedInTurn++;
            if (currentPlayer.questionsAskedInTurn >= game.maxQuestionsPerTurn) {
                this.logGameAction(gameCode, { type: 'system', text: `${currentPlayer.name} задал максимальное количество вопросов. Ход переходит.` });
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
        const isCorrect = guess.trim().toLowerCase() === correctCharacter.toLowerCase();

        this.logGameAction(gameCode, { type: 'guess', playerName: currentPlayer.name, text: guess, isCorrect });

        if (isCorrect) {
            currentPlayer.guessed = true;
            this.logGameAction(gameCode, { type: 'system', text: `${currentPlayer.name} угадал своего персонажа: "${correctCharacter}"!` });
            this.endGame(gameCode, `${currentPlayer.name} победил!`);
        } else {
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
        this.logGameAction(gameCode, { type: 'system', text: `Ход перешел к ${game.players[game.currentPlayerIndex].name}.` });
        return game;
    }

    endGame(gameCode, message) {
        const game = this.activeGames[gameCode];
        if (game) {
            game.status = 'finished';
            this.logGameAction(gameCode, { type: 'system', text: `Игра завершена: ${message}` });
            setTimeout(() => {
                delete this.activeGames[gameCode];
                console.log(`Игра ${gameCode} удалена из памяти.`);
            }, 30000);
        }
    }
}

module.exports = new GameManager();