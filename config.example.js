/**
 * Firebase Configuration
 * 
 * Instructions:
 * 1. Create a new project at https://console.firebase.google.com
 * 2. Enable Realtime Database in your project
 * 3. Copy your Firebase configuration from Project Settings > General > Your Apps
 * 4. Create a new file named 'config.secret.js' with your actual configuration
 * 5. Never commit config.secret.js to version control
 */

// Copy this entire file to config.secret.js and replace with your Firebase values
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Don't modify this line - it's used by config.js
if (typeof module !== 'undefined') module.exports = { firebaseConfig };