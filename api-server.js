const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const botInfo = {
    name: "Venocyber-MD",
    owner: "rajola",
    phone: "+255676195192",
    channel: "https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P"
};

// Knowledge base
const knowledge = {
    greetings: ['hello', 'hi', 'hey'],
    about: ['who are you', 'your name', 'about'],
    owner: ['owner', 'creator', 'rajola'],
    channel: ['channel', 'whatsapp', 'group'],
    time: ['time', 'clock'],
    date: ['date', 'today'],
    jokes: ['joke', 'funny', 'laugh']
};

app.post('/api/venocyber/chat', (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.json({ 
            response: "Please say something!",
            bot: botInfo.name
        });
    }

    const msg = message.toLowerCase();
    let response = "";

    // Rule-based responses
    if (msg.includes('hello') || msg.includes('hi')) {
        response = `Hello! I'm ${botInfo.name}, created by ${botInfo.owner}. How can I help?`;
    }
    else if (msg.includes('who are you') || msg.includes('your name')) {
        response = `I'm ${botInfo.name}, an AI chatbot built by ${botInfo.owner}!`;
    }
    else if (msg.includes('owner') || msg.includes('creator') || msg.includes('rajola')) {
        response = `My creator is ${botInfo.owner}. Contact: ${botInfo.phone}`;
    }
    else if (msg.includes('channel')) {
        response = `Join my channel: ${botInfo.channel}`;
    }
    else if (msg.includes('time')) {
        response = `Current time: ${new Date().toLocaleTimeString()}`;
    }
    else if (msg.includes('date')) {
        response = `Today's date: ${new Date().toLocaleDateString()}`;
    }
    else if (msg.includes('joke')) {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "What do you call a fake noodle? An impasta!",
            "Why did the scarecrow win an award? He was outstanding in his field!"
        ];
        response = jokes[Math.floor(Math.random() * jokes.length)];
    }
    else if (msg.includes('bye')) {
        response = "Goodbye! Chat with me again soon! 👋";
    }
    else if (msg.includes('help')) {
        response = `I can tell you about ${botInfo.name}, my owner ${botInfo.owner}, share jokes, give time/date, and more!`;
    }
    else {
        const fallbacks = [
            `That's interesting! I'm ${botInfo.name}, created by ${botInfo.owner}.`,
            "Tell me more about that!",
            "I see! How can I assist you further?",
            `By the way, did you know my creator is ${botInfo.owner}?`,
            "Interesting! What else would you like to know?"
        ];
        response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    res.json({
        success: true,
        response: response,
        bot: botInfo.name,
        owner: botInfo.owner,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/venocyber/info', (req, res) => {
    res.json(botInfo);
});

app.listen(3000, () => {
    console.log('✅ Venocyber-MD API running on port 3000');
});
