class Game {
    constructor(gameCode, player, numQuestions = 5) {
        this.gameCode = gameCode;
        this.player = player;
        this.gameRef = database.ref('games/' + gameCode);
        this.currentQuestion = 0;
        this.timer = null;
        this.hasAnswered = false;
        this.isTransitioning = false;
        this.numQuestions = numQuestions;
        this.setupGameListeners();
    }

    setupGameListeners() {
        // Listen for game state changes
        this.gameRef.on('value', (snapshot) => {
            const gameData = snapshot.val();
            if (!gameData) return;

            // Update current question and reset state
            if (gameData.currentQuestion !== this.currentQuestion) {
                this.currentQuestion = gameData.currentQuestion;
                this.hasAnswered = false;
                this.isTransitioning = false;
            }

            // Update question counter
            document.getElementById('currentQuestionNum').textContent = this.currentQuestion + 1;
            document.getElementById('totalQuestions').textContent = gameData.numQuestions;

            // Update game state
            this.updateGameState(gameData);

            // Update player display in waiting room
            this.updateWaitingRoom(gameData);
        });
    }

    updateWaitingRoom(gameData) {
        const playersDiv = document.getElementById('players');
        if (playersDiv) {
            playersDiv.innerHTML = Object.values(gameData.players || {})
                .map(p => `<p>${p.username}${p.isHost ? ' (Host)' : ''}</p>`)
                .join('');
        }
    }

    updateGameState(gameData) {
        switch (gameData.status) {
            case 'waiting':
                // Show waiting room for both players
                document.getElementById('waitingRoom').classList.remove('hidden');
                document.getElementById('gameScreen').classList.add('hidden');
                break;
            case 'starting':
                this.startGame();
                break;
            case 'in_progress':
                this.updateGameProgress(gameData);
                break;
            case 'finished':
                this.showResults(gameData);
                break;
        }
    }

    startGame() {
        if (this.player.isHost) {
            this.gameRef.update({
                status: 'in_progress',
                currentQuestion: 0,
                timer: 15,
                answers: {}
            });
        }
        document.getElementById('waitingRoom').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');
        this.showQuestion(0);
    }

    updateGameProgress(gameData) {
        // Ensure we're showing the game screen
        document.getElementById('waitingRoom').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');

        const questionNumber = gameData.currentQuestion;
        
        // Check if we've reached the end of questions
        if (questionNumber >= gameData.numQuestions) {
            if (this.player.isHost) {
                this.gameRef.update({ status: 'finished' });
            }
            return;
        }

        this.showQuestion(questionNumber);
        this.updateScores(gameData.players);
        this.updateTimer(gameData.timer);

        // Check for question advancement
        if (this.player.isHost && gameData.answers && !this.isTransitioning) {
            const answersCount = Object.keys(gameData.answers).length;
            if (answersCount >= 2) {
                this.isTransitioning = true;
                setTimeout(() => {
                    this.nextQuestion();
                }, 2000);
            }
        }
    }

    showQuestion(questionNumber) {
        if (questionNumber >= this.numQuestions) {
            if (this.player.isHost) {
                this.gameRef.update({ status: 'finished' });
            }
            return;
        }

        // Get questions from game data
        this.gameRef.once('value', snapshot => {
            const gameData = snapshot.val();
            if (!gameData || !gameData.questions) return;

            const question = gameData.questions[questionNumber % gameData.questions.length];
            document.getElementById('question').textContent = question.question;
            
            const optionsContainer = document.getElementById('options');
            optionsContainer.innerHTML = '';
            
            question.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option';
                button.textContent = option;
                button.onclick = () => this.submitAnswer(index);
                button.disabled = this.hasAnswered;
                optionsContainer.appendChild(button);
            });
        });
    }

    submitAnswer(answerIndex) {
        if (this.hasAnswered) return;

        this.hasAnswered = true;
        const playerRef = this.gameRef.child('players').child(this.player.id);
        
        // Get current question from game data
        this.gameRef.once('value', snapshot => {
            const gameData = snapshot.val();
            if (!gameData || !gameData.questions) return;

            const currentQuestion = gameData.questions[this.currentQuestion % gameData.questions.length];
            const timeLeft = parseInt(document.getElementById('timer').textContent);
            
            // Record answer in Firebase
            this.gameRef.child('answers').child(this.player.id).set({
                answerIndex: answerIndex,
                timeLeft: timeLeft
            });

            if (answerIndex === currentQuestion.correctAnswer) {
                const points = Math.max(5, timeLeft);
                playerRef.child('score').transaction(score => (score || 0) + points);
            }

            // Disable options after answering
            const options = document.querySelectorAll('.option');
            options.forEach(option => option.disabled = true);
        });
    }

    nextQuestion() {
        if (!this.player.isHost) return;
        
        const nextQuestionNum = this.currentQuestion + 1;
        if (nextQuestionNum < this.numQuestions) {
            this.gameRef.update({
                currentQuestion: nextQuestionNum,
                timer: 15,
                answers: null
            });
        } else {
            this.gameRef.update({ status: 'finished' });
        }
    }

    updateTimer(time) {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = time;

        if (this.player.isHost && time > 0) {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.gameRef.child('timer').transaction(currentTime => {
                    if (currentTime <= 0) return 0;
                    return currentTime - 1;
                }).then((result) => {
                    // If timer reached 0, force move to next question after delay
                    if (result.snapshot.val() === 0) {
                        if (!this.isTransitioning) {
                            this.isTransitioning = true;
                            // Record timeout for players who haven't answered
                            this.handleTimeoutAnswers();
                            setTimeout(() => this.nextQuestion(), 2000);
                        }
                    }
                });
            }, 1000);
        }
    }

    handleTimeoutAnswers() {
        if (!this.player.isHost) return;
        
        this.gameRef.child('answers').once('value', (snapshot) => {
            const answers = snapshot.val() || {};
            const playerRefs = {};
            
            // Get all players who haven't answered
            this.gameRef.child('players').once('value', (playersSnapshot) => {
                const players = playersSnapshot.val() || {};
                Object.keys(players).forEach(playerId => {
                    if (!answers[playerId]) {
                        // Record timeout answer for player
                        this.gameRef.child('answers').child(playerId).set({
                            answerIndex: -1, // -1 indicates timeout
                            timeLeft: 0
                        });
                    }
                });
            });
        });
    }

    updateScores(players) {
        Object.entries(players).forEach(([playerId, playerData]) => {
            const scoreElement = document.querySelector(`#player${playerData.isHost ? '1' : '2'}Score`);
            if (scoreElement) {
                scoreElement.querySelector('.player-name').textContent = playerData.username;
                scoreElement.querySelector('.score').textContent = playerData.score || 0;
            }
        });
    }

    showResults(gameData) {
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('resultsScreen').classList.remove('hidden');

        const players = Object.values(gameData.players);
        const winner = players.reduce((a, b) => (a.score > b.score ? a : b));
        
        document.getElementById('winner').textContent = 
            `🎉 ${winner.username} wins with ${winner.score} points! 🎉`;

        const finalScores = document.getElementById('finalScores');
        finalScores.innerHTML = players
            .map(p => `<p>${p.username}: ${p.score} points</p>`)
            .join('');
    }

    cleanup() {
        this.gameRef.off();
        clearTimeout(this.timer);
    }
} 