// Import Firebase configuration from secret file
// If running locally and config.secret.js doesn't exist, copy config.example.js to config.secret.js and fill in your values
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwti4dCX0vvGTavP1uhfQuQwSR1V_cL5w",
    authDomain: "pvpflashcard.firebaseapp.com",
    databaseURL: "https://pvpflashcard-default-rtdb.firebaseio.com",
    projectId: "pvpflashcard",
    storageBucket: "pvpflashcard.firebasestorage.app",
    messagingSenderId: "700599564670",
    appId: "1:700599564670:web:045832ebfecc345bdadb2f",
    measurementId: "G-FWTB1PQJCK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Helper function to generate random game codes
function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper function to create a new game room
function createGameRoom(gameCode, hostPlayer, numQuestions = 5, questionSetId = null, customQuestions = null) {
    // Get the questions to use
    let gameQuestions = customQuestions || questions;
    
    // Shuffle the questions
    gameQuestions = shuffleArray(gameQuestions);
    
    // If numQuestions is less than the total questions, take only that many
    if (numQuestions < gameQuestions.length) {
        gameQuestions = gameQuestions.slice(0, numQuestions);
    }

    return database.ref('games/' + gameCode).set({
        players: {
            [hostPlayer.id]: {
                username: hostPlayer.username,
                score: 0,
                isHost: true
            }
        },
        status: 'waiting',
        currentQuestion: 0,
        timer: 15,
        numQuestions: Math.min(numQuestions, gameQuestions.length),
        questionSetId: questionSetId,
        questions: gameQuestions,
        answers: null,
        created: firebase.database.ServerValue.TIMESTAMP
    });
}

// Helper function to join a game room
function joinGameRoom(gameCode, player) {
    const gameRef = database.ref('games/' + gameCode);
    return gameRef.transaction((game) => {
        if (!game) return null;
        if (game.status !== 'waiting') return;
        if (Object.keys(game.players || {}).length >= 2) return;

        if (!game.players) game.players = {};
        game.players[player.id] = {
            username: player.username,
            score: 0,
            isHost: false
        };

        // Change status to 'starting' when second player joins
        if (Object.keys(game.players).length === 2) {
            game.status = 'starting';
            game.lastUpdated = firebase.database.ServerValue.TIMESTAMP;
        }

        return game;
    });
}

// Clean up old games (optional, can be called periodically)
function cleanupOldGames() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const gamesRef = database.ref('games');
    
    gamesRef.orderByChild('created')
        .endAt(oneHourAgo)
        .once('value')
        .then((snapshot) => {
            const updates = {};
            snapshot.forEach((child) => {
                updates[child.key] = null;
            });
            return gamesRef.update(updates);
        });
} 
