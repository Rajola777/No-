const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

const BOT_NAME = 'Venocyber-MD';
const OWNER = 'rajola';
const OWNER_NUMBER = '+255676195192';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P';

// Local response database
const responses = {
    greetings: {
        patterns: ['hello', 'hi', 'hey', 'greetings'],
        responses: [
            "Hello! I'm Venocyber-MD, how can I assist you today?",
            "Hi there! Great to see you! 👋",
            "Hey! What can I do for you?"
        ]
    },
    about: {
        patterns: ['who are you', 'what is your name', 'your name', 'about you'],
        responses: [
            `I'm ${BOT_NAME}, an AI chatbot created by ${OWNER}!`,
            `My name is ${BOT_NAME} and I'm here to help you!`
        ]
    },
    owner: {
        patterns: ['owner', 'creator', 'who made you', 'who created you'],
        responses: [
            `I was created by ${OWNER}! You can contact them at ${OWNER_NUMBER}`,
            `${OWNER} is my creator and owner. They built me to help people like you!`
        ]
    },
    channel: {
        patterns: ['channel', 'whatsapp channel', 'join channel', 'group'],
        responses: [
            `Join my WhatsApp channel: ${CHANNEL_LINK}`,
            `You can join our community here: ${CHANNEL_LINK}`
        ]
    },
    help: {
        patterns: ['help', 'support', 'commands', 'what can you do'],
        responses: [
            `I can chat with you, answer questions, tell jokes, and more! Just ask me anything.`,
            `Need help? I'm here to assist! Ask me about anything.`
        ]
    },
    time: {
        patterns: ['time', 'current time', 'what time'],
        responses: [`Current time is ${new Date().toLocaleTimeString()}`]
    },
    date: {
        patterns: ['date', 'today date', 'what date'],
        responses: [`Today is ${new Date().toLocaleDateString()}`]
    },
    joke: {
        patterns: ['joke', 'funny', 'laugh'],
        responses: [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "What do you call a fake noodle? An impasta! 🍝",
            "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾"
        ]
    },
    weather: {
        patterns: ['weather', 'temperature'],
        responses: ["I can't check real weather yet, but I hope it's sunny where you are! ☀️"]
    },
    goodbye: {
        patterns: ['bye', 'goodbye', 'see you', 'exit'],
        responses: [
            "Goodbye! Feel free to come back anytime! 👋",
            "Take care! Talk to you later!",
            "Bye! Have a great day!"
        ]
    },
    thanks: {
        patterns: ['thanks', 'thank you', 'appreciate'],
        responses: [
            "You're welcome! Happy to help! 😊",
            "My pleasure!",
            "Anytime! That's what I'm here for."
        ]
    }
};

// Default responses for unknown queries
const defaultResponses = [
    "That's interesting! Tell me more.",
    "I understand. How can I help you with that?",
    "Thanks for sharing! What else would you like to know?",
    "I'm here to help! Feel free to ask me anything.",
    "That's a good question! Let me think about it...",
    "I appreciate your message! Is there something specific you'd like to know?",
    "Interesting! Can you elaborate more?"
];

// Function to find best matching response
function findResponse(message) {
    message = message.toLowerCase();
    
    // Check all categories
    for (let category in responses) {
        const categoryData = responses[category];
        for (let pattern of categoryData.patterns) {
            if (message.includes(pattern)) {
                const responses_list = categoryData.responses;
                return responses_list[Math.floor(Math.random() * responses_list.length)];
            }
        }
    }
    
    // Return random default response if no match
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Chat endpoint
app.post('/chat', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = findResponse(message);
    
    res.json({
        success: true,
        response: response,
        bot: BOT_NAME,
        owner: OWNER,
        timestamp: new Date().toISOString()
    });
});

// Bot info endpoint
app.get('/info', (req, res) => {
    res.json({
        name: BOT_NAME,
        owner: OWNER,
        ownerNumber: OWNER_NUMBER,
        channel: CHANNEL_LINK,
        version: '1.0.0',
        features: ['Chat', 'Jokes', 'Time/Date', 'About', 'Help']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'active', message: `${BOT_NAME} is running!` });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`╔══════════════════════════════════╗`);
    console.log(`║     ${BOT_NAME} AI Chatbot       ║`);
    console.log(`║      Created by: ${OWNER}        ║`);
    console.log(`║      Running on port ${PORT}     ║`);
    console.log(`╚══════════════════════════════════╝`);
});
