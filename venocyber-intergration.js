// Venocyber-MD Chatbot Integration
class VenocyberChatbot {
    constructor() {
        this.botName = "Venocyber-MD";
        this.owner = "rajola";
        this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        this.apiKey = "YOUR_GEMINI_API_KEY"; // Get free from https://makersuite.google.com/app/apikey
    }

    async getResponse(userMessage) {
        try {
            // Try Gemini API first
            const response = await this.callGeminiAPI(userMessage);
            return response;
        } catch (error) {
            console.log("API failed, using local responses");
            return this.getLocalResponse(userMessage);
        }
    }

    async callGeminiAPI(message) {
        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are Venocyber-MD, an AI chatbot created by rajola. 
                              Owner's WhatsApp: +255676195192
                              Channel: https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P
                              
                              User: ${message}`
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    getLocalResponse(message) {
        message = message.toLowerCase();
        
        // Knowledge base
        if (message.includes('hello') || message.includes('hi')) {
            return "Hello! I'm Venocyber-MD, created by rajola. How can I help you?";
        }
        else if (message.includes('who are you') || message.includes('your name')) {
            return "I'm Venocyber-MD, an AI chatbot created by rajola!";
        }
        else if (message.includes('owner') || message.includes('creator') || message.includes('rajola')) {
            return "My owner is rajola! You can contact them at +255676195192";
        }
        else if (message.includes('channel') || message.includes('whatsapp channel')) {
            return "Join my WhatsApp channel: https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P";
        }
        else if (message.includes('help')) {
            return "I can chat with you, tell jokes, share info about rajola, and more!";
        }
        else if (message.includes('joke')) {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "What do you call a fake noodle? An impasta!",
                "Why did the scarecrow win an award? He was outstanding in his field!"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        else if (message.includes('bye')) {
            return "Goodbye! Feel free to chat again! 👋";
        }
        else {
            const defaultResponses = [
                "That's interesting! Tell me more.",
                "I understand. How can I help you with that?",
                "Thanks for sharing! What else would you like to know?",
                "I'm here to help! Feel free to ask me anything.",
                `By the way, I'm Venocyber-MD created by rajola!`
            ];
            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
    }
}

// Initialize chatbot
const venocyber = new VenocyberChatbot();

// Function to send message to Venocyber
async function sendToVenocyber(userMessage) {
    // Show typing indicator
    showTypingIndicator();
    
    // Get bot response
    const botResponse = await venocyber.getResponse(userMessage);
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Display bot message in your chat UI
    displayBotMessage(botResponse);
    
    return botResponse;
}

// Integration with your existing chat functions
async function handleUserMessage(message) {
    // Your existing code to display user message
    displayUserMessage(message);
    
    // Send to Venocyber and get response
    await sendToVenocyber(message);
}

// Modify your existing send button/function
document.getElementById('sendButton').addEventListener('click', async function() {
    const message = document.getElementById('messageInput').value;
    if (message.trim() !== '') {
        await handleUserMessage(message);
        document.getElementById('messageInput').value = '';
    }
});

// For enter key
document.getElementById('messageInput').addEventListener('keypress', async function(e) {
    if (e.key === 'Enter') {
        const message = this.value;
        if (message.trim() !== '') {
            await handleUserMessage(message);
            this.value = '';
        }
    }
});
