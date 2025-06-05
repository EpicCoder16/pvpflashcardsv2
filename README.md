# PVP Flashcards Battle

A real-time multiplayer flashcard game where two players can compete against each other using custom flashcard sets.

## Features

- Real-time multiplayer gameplay
- Custom question sets
- Quizlet import support
- Score tracking
- Timed responses
- Customizable number of questions (1-50)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pvpflashcards.git
cd pvpflashcards
```

2. Set up Firebase configuration:
   - Copy `config.example.js` to `config.secret.js`
   - Create a new project in [Firebase Console](https://console.firebase.google.com)
   - Enable Realtime Database in your Firebase project
   - Copy your Firebase configuration from Project Settings
   - Paste your configuration in `config.secret.js`

3. To run locally, you can use any static file server. For example, with Python:
```bash
# Python 3
python -m http.server 8080
# Python 2
python -m SimpleHTTPServer 8080
```

Then visit `http://localhost:8080` in your browser.

## Deployment

### GitHub Pages

1. Push your code to GitHub (note: don't commit `config.secret.js`)
2. Go to repository Settings > Pages
3. Under "Source", select "main" branch
4. Click Save
5. Your site will be published at `https://yourusername.github.io/pvpflashcards`
6. After deployment, update `config.secret.js` on your deployed site with your Firebase configuration

### Netlify

1. Push your code to GitHub (note: don't commit `config.secret.js`)
2. Go to [Netlify](https://www.netlify.com/)
3. Click "New site from Git"
4. Select your repository
5. Add your Firebase configuration as environment variables in Netlify
6. Deploy settings will be automatically configured
7. Click "Deploy site"

## Usage

1. Enter your username
2. Create a game or join an existing game with a game code
3. To use custom questions:
   - Click "Create Custom Questions"
   - Either enter questions manually or paste from Quizlet
   - Click "Save & Use"
4. Choose number of questions (1-50)
5. Share the game code with another player
6. Play!

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - CSS styles and animations
- `config.js` - Firebase configuration and helper functions
- `questions.js` - Sample flashcard questions
- `game.js` - Game logic and Firebase interactions
- `app.js` - Main application initialization and event handlers

## Customization

### Adding Questions
To add or modify questions, edit the `questions.js` file. Each question should follow this format:

```javascript
{
    question: "Your question here?",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    correctAnswer: 0 // Index of the correct option (0-3)
}
```

### Styling
The game uses CSS variables for easy customization. Main colors can be modified in the `:root` section of `styles.css`.

## Security Notes

- This is a basic implementation. For production use, add:
  - User authentication
  - Server-side validation
  - Rate limiting
  - Proper security rules in Firebase
- Never commit sensitive information like API keys to version control
- Use environment variables or secure secret management in production

## License

MIT License - Feel free to use and modify for your needs! 