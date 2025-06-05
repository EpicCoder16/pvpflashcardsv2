// Question set management
class QuestionSetManager {
    constructor() {
        this.currentSet = null;
        this.defaultSet = questions; // Reference to default questions from questions.js
    }

    // Parse raw text in format: Question|Correct Answer|Wrong1|Wrong2|Wrong3
    importFromText(text) {
        try {
            const lines = text.split('\n').filter(line => line.trim());
            const questionSet = lines.map(line => {
                const [question, correct, ...wrong] = line.split('|').map(s => s.trim());
                if (!question || !correct || wrong.length === 0) {
                    throw new Error('Invalid question format');
                }
                
                // Randomize option order while tracking correct answer
                const options = [correct, ...wrong];
                const shuffled = this.shuffleArray(options);
                const correctIndex = shuffled.indexOf(correct);

                return {
                    question: question,
                    options: shuffled,
                    correctAnswer: correctIndex
                };
            });

            // Store the questions directly in currentSet
            this.currentSet = questionSet;
            return questionSet;
        } catch (error) {
            console.error('Text import error:', error);
            throw error;
        }
    }

    // Convert Quizlet paste format to our question format
    convertFromQuizlet(text) {
        try {
            // Split into lines and remove empty ones
            const lines = text.split('\n')
                .map(line => line.trim())
                .filter(line => line);

            // Group into term-definition pairs
            const pairs = [];
            for (let i = 0; i < lines.length; i += 2) {
                if (i + 1 < lines.length) {
                    pairs.push({
                        term: lines[i],
                        definition: lines[i + 1]
                    });
                }
            }

            if (pairs.length === 0) {
                throw new Error('No valid term-definition pairs found');
            }

            // Convert each pair into our question format
            const questionSet = pairs.map(pair => {
                // Generate wrong answers from other definitions
                const otherDefinitions = pairs
                    .filter(p => p.definition !== pair.definition)
                    .map(p => p.definition)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);

                // If we don't have enough wrong answers, generate some
                while (otherDefinitions.length < 3) {
                    otherDefinitions.push(`Incorrect answer ${otherDefinitions.length + 1}`);
                }

                const options = [pair.definition, ...otherDefinitions];
                const shuffled = this.shuffleArray(options);
                const correctIndex = shuffled.indexOf(pair.definition);

                return {
                    question: pair.term,
                    options: shuffled,
                    correctAnswer: correctIndex
                };
            });

            // Store the questions directly in currentSet
            this.currentSet = questionSet;
            return questionSet;
        } catch (error) {
            console.error('Quizlet conversion error:', error);
            throw error;
        }
    }

    // Save question set to Firebase (optional)
    async saveQuestionSet(name, questions, isPublic = false) {
        try {
            const user = firebase.auth().currentUser;
            
            // If user is logged in, save to Firebase
            if (user) {
                const setRef = await database.ref('questionSets').push({
                    name: name,
                    questions: questions,
                    creator: user.uid,
                    isPublic: isPublic,
                    created: firebase.database.ServerValue.TIMESTAMP
                });
                return setRef.key;
            }
            
            // If not logged in, just store locally
            this.currentSet = questions;
            return null;
        } catch (error) {
            console.error('Save error:', error);
            // If save fails, still store locally
            this.currentSet = questions;
            return null;
        }
    }

    // Get current question set
    getCurrentSet() {
        return this.currentSet || this.defaultSet;
    }

    // Load question set from Firebase
    async loadQuestionSet(setId) {
        try {
            const snapshot = await database.ref(`questionSets/${setId}`).once('value');
            const set = snapshot.val();
            if (!set) throw new Error('Question set not found');
            this.currentSet = set.questions;
            return set.questions;
        } catch (error) {
            console.error('Load error:', error);
            throw error;
        }
    }

    // Helper function to shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
} 