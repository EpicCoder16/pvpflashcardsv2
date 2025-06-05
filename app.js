// Main application logic
let currentGame = null;
let questionManager = new QuestionSetManager();
let customQuestions = null;

// DOM Elements
const homeScreen = document.getElementById('homeScreen');
const waitingRoom = document.getElementById('waitingRoom');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const customSetModal = document.getElementById('customSetModal');

// Button Elements
const createGameBtn = document.getElementById('createGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const customSetBtn = document.getElementById('customSetBtn');
const saveCustomSetBtn = document.getElementById('saveCustomSetBtn');
const cancelCustomSetBtn = document.getElementById('cancelCustomSetBtn');
const convertQuizletBtn = document.getElementById('convertQuizletBtn');

// Input Elements
const usernameInput = document.getElementById('username');
const gameCodeInput = document.getElementById('gameCode');
const numQuestionsInput = document.getElementById('numQuestions');
const customQuestionsInput = document.getElementById('customQuestions');
const quizletPasteInput = document.getElementById('quizletPaste');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Tab switching logic
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show/hide content
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tab}Tab`).classList.remove('hidden');
    });
});

// Custom Question Set Modal
customSetBtn.addEventListener('click', () => {
    customSetModal.classList.remove('hidden');
});

cancelCustomSetBtn.addEventListener('click', () => {
    customSetModal.classList.add('hidden');
    customQuestionsInput.value = '';
    quizletPasteInput.value = '';
});

// Convert Quizlet paste to our format
convertQuizletBtn.addEventListener('click', () => {
    try {
        const text = quizletPasteInput.value.trim();
        if (!text) {
            alert('Please paste your Quizlet content first');
            return;
        }

        customQuestions = questionManager.convertFromQuizlet(text);
        alert('Quizlet content converted successfully!');
        
        // Switch to manual tab to show the converted questions
        const formattedQuestions = customQuestions.map(q => 
            `${q.question}|${q.options[q.correctAnswer]}|${q.options.filter((_, i) => i !== q.correctAnswer).join('|')}`
        ).join('\n');
        
        customQuestionsInput.value = formattedQuestions;
        tabButtons[0].click(); // Switch to manual tab
    } catch (error) {
        alert('Error converting Quizlet content: ' + error.message);
    }
});

saveCustomSetBtn.addEventListener('click', () => {
    try {
        const text = customQuestionsInput.value.trim();
        if (!text) {
            alert('Please enter some questions');
            return;
        }

        customQuestions = questionManager.importFromText(text);
        customSetModal.classList.add('hidden');
        alert('Custom questions loaded successfully!');
    } catch (error) {
        alert('Error loading custom questions: ' + error.message);
    }
});

// Validate number of questions input
numQuestionsInput.addEventListener('change', () => {
    const value = parseInt(numQuestionsInput.value);
    if (value < 1) numQuestionsInput.value = 1;
    if (value > 50) numQuestionsInput.value = 50;
});

// Create Game
createGameBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }

    const numQuestions = parseInt(numQuestionsInput.value);
    if (isNaN(numQuestions) || numQuestions < 1 || numQuestions > 50) {
        alert('Please enter a valid number of questions (1-50)');
        return;
    }

    const gameCode = generateGameCode();
    const player = {
        id: Date.now().toString(),
        username: username,
        isHost: true
    };

    try {
        // Get the current question set (custom or default)
        const currentQuestions = questionManager.getCurrentSet();
        
        // Create game room with current questions
        await createGameRoom(gameCode, player, numQuestions, null, currentQuestions);
        currentGame = new Game(gameCode, player, numQuestions);
        
        homeScreen.classList.add('hidden');
        waitingRoom.classList.remove('hidden');
        document.getElementById('displayGameCode').textContent = gameCode;
        document.getElementById('displayNumQuestions').textContent = numQuestions;
    } catch (error) {
        alert('Error creating game: ' + error.message);
    }
});

// Join Game
joinGameBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const gameCode = gameCodeInput.value.trim().toUpperCase();

    if (!username || !gameCode) {
        alert('Please enter both username and game code');
        return;
    }

    const player = {
        id: Date.now().toString(),
        username: username,
        isHost: false
    };

    try {
        const result = await joinGameRoom(gameCode, player);
        if (!result.committed) {
            alert('Could not join game. Game might be full or already started.');
            return;
        }

        const gameData = await database.ref('games/' + gameCode).get();
        const numQuestions = gameData.val().numQuestions;

        // Load custom questions if they exist
        if (gameData.val().questionSetId) {
            customQuestions = await questionManager.loadQuestionSet(gameData.val().questionSetId);
        }

        currentGame = new Game(gameCode, player, numQuestions);
        
        homeScreen.classList.add('hidden');
        waitingRoom.classList.remove('hidden');
        document.getElementById('displayGameCode').textContent = gameCode;
        document.getElementById('displayNumQuestions').textContent = numQuestions;
    } catch (error) {
        alert('Error joining game: ' + error.message);
    }
});

// Play Again
playAgainBtn.addEventListener('click', () => {
    if (currentGame) {
        currentGame.cleanup();
        currentGame = null;
    }
    
    resultsScreen.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    
    // Reset inputs and state
    usernameInput.value = '';
    gameCodeInput.value = '';
    numQuestionsInput.value = '5';
    customQuestions = null;
    customQuestionsInput.value = '';
    quizletPasteInput.value = '';
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (currentGame) {
        currentGame.cleanup();
    }
}); 