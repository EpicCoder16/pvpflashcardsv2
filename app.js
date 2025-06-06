// Main application logic
let currentGame = null;
let questionManager = new QuestionSetManager();
let selectedQuestionSet = null;

// DOM Elements
const homeScreen = document.getElementById('homeScreen');
const waitingRoom = document.getElementById('waitingRoom');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const customSetModal = document.getElementById('customSetModal');
const browseSetsModal = document.getElementById('browseSetsModal');

// Button Elements
const createGameBtn = document.getElementById('createGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const customSetBtn = document.getElementById('customSetBtn');
const browseSetBtn = document.getElementById('browseSetBtn');
const saveCustomSetBtn = document.getElementById('saveCustomSetBtn');
const cancelCustomSetBtn = document.getElementById('cancelCustomSetBtn');
const closeBrowseBtn = document.getElementById('closeBrowseBtn');
const clearSetBtn = document.getElementById('clearSetBtn');

// Input Elements
const usernameInput = document.getElementById('username');
const gameCodeInput = document.getElementById('gameCode');
const numQuestionsInput = document.getElementById('numQuestions');
const customQuestionsInput = document.getElementById('customQuestions');
const quizletPasteInput = document.getElementById('quizletPasteInput');

// Display Elements
const selectedSetName = document.getElementById('selectedSetName');
const selectedSetInfo = document.getElementById('selectedSetInfo');
const questionSets = document.getElementById('questionSets');
const answerFeedback = document.getElementById('answerFeedback');

// Tab Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize question sets
function initializeQuestionSets() {
    questionSets.innerHTML = '';
    defaultQuestionSets.forEach(set => {
        const card = document.createElement('div');
        card.className = 'question-set-card';
        card.dataset.setId = set.id;
        card.innerHTML = `
            <h3>${set.name}</h3>
            <p>${set.description}</p>
            <p><small>${set.questions.length} questions</small></p>
        `;
        card.onclick = () => selectQuestionSet(set);
        questionSets.appendChild(card);
    });
}

// Select a question set
function selectQuestionSet(set) {
    selectedQuestionSet = set;
    selectedSetName.textContent = set.name;
    selectedSetInfo.classList.remove('hidden');
    browseSetsModal.classList.add('hidden');
    
    // Update selected state in UI
    document.querySelectorAll('.question-set-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.setId === set.id);
    });
}

// Clear selected set
clearSetBtn.onclick = () => {
    selectedQuestionSet = null;
    selectedSetName.textContent = 'None';
    selectedSetInfo.classList.add('hidden');
    document.querySelectorAll('.question-set-card').forEach(card => {
        card.classList.remove('selected');
    });
};

// Show answer feedback
function showAnswerFeedback(isCorrect) {
    const feedbackIcon = answerFeedback.querySelector('.feedback-icon');
    feedbackIcon.className = 'feedback-icon ' + (isCorrect ? 'correct' : 'incorrect');
    answerFeedback.classList.remove('hidden');
    setTimeout(() => {
        answerFeedback.classList.add('hidden');
    }, 1000);
}

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

// Modal controls
browseSetBtn.onclick = () => {
    browseSetsModal.classList.remove('hidden');
};

closeBrowseBtn.onclick = () => {
    browseSetsModal.classList.add('hidden');
};

customSetBtn.onclick = () => {
    customSetModal.classList.remove('hidden');
};

cancelCustomSetBtn.onclick = () => {
    customSetModal.classList.add('hidden');
};

// Create Game
createGameBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter a username');
        return;
    }

    if (!selectedQuestionSet && !questionManager.getCurrentSet()) {
        alert('Please select a question set or create your own');
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
        // Get the current question set (custom or selected)
        const currentQuestions = questionManager.getCurrentSet() || selectedQuestionSet.questions;
        
        // Create game room with current questions
        await createGameRoom(gameCode, player, numQuestions, selectedQuestionSet?.id, currentQuestions);
        currentGame = new Game(gameCode, player, numQuestions);
        
        homeScreen.classList.add('hidden');
        waitingRoom.classList.remove('hidden');
        document.getElementById('displayGameCode').textContent = gameCode;
        document.getElementById('displayNumQuestions').textContent = numQuestions;
        document.getElementById('displaySetName').textContent = selectedQuestionSet ? selectedQuestionSet.name : 'Custom Set';
    } catch (error) {
        alert('Error creating game: ' + error.message);
    }
});

// Save custom questions
saveCustomSetBtn.addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    let questions;

    if (activeTab === 'manual') {
        questions = parseManualQuestions(customQuestionsInput.value);
    } else {
        questions = parseQuizletQuestions(quizletPasteInput.value);
    }

    if (questions && questions.length > 0) {
        questionManager.setCurrentSet(questions);
        selectedQuestionSet = null;
        selectedSetName.textContent = 'Custom Set';
        selectedSetInfo.classList.remove('hidden');
        customSetModal.classList.add('hidden');
    } else {
        alert('Please enter valid questions');
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
        const setId = gameData.val().questionSetId;

        currentGame = new Game(gameCode, player, numQuestions);
        
        homeScreen.classList.add('hidden');
        waitingRoom.classList.remove('hidden');
        document.getElementById('displayGameCode').textContent = gameCode;
        document.getElementById('displayNumQuestions').textContent = numQuestions;
        document.getElementById('displaySetName').textContent = setId ? 
            defaultQuestionSets.find(set => set.id === setId)?.name || 'Custom Set' : 
            'Custom Set';
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
    customQuestionsInput.value = '';
    quizletPasteInput.value = '';
    selectedQuestionSet = null;
    selectedSetName.textContent = 'None';
    selectedSetInfo.classList.add('hidden');
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (currentGame) {
        currentGame.cleanup();
    }
});

// Initialize question sets on load
initializeQuestionSets(); 
