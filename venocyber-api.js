// venocyber-api.js - Venocyber-MD AI Service
// Created by rajola

class VenocyberAI {
    constructor() {
        this.name = "Venocyber-MD";
        this.owner = "rajola";
        this.phone = "+255676195192";
        this.channel = "https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P";
        this.context = [];
        this.apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        this.apiKey = "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE"; // Your Firebase API key (can also use Gemini)
        
        console.log(`🤖 ${this.name} AI initialized by ${this.owner}`);
    }

    async getResponse(message) {
        try {
            // Try Gemini API first
            const response = await this.callGeminiAPI(message);
            return response;
        } catch (error) {
            console.log("⚠️ API failed, using local responses:", error);
            return this.getLocalResponse(message);
        }
    }

    async callGeminiAPI(message) {
        try {
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
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
                                  
                                  User: ${message}
                                  
                                  Respond in a helpful, friendly manner. Keep responses concise.`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API responded with ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid API response structure");
            }
        } catch (error) {
            console.error("❌ Gemini API error:", error);
            throw error; // Fall back to local responses
        }
    }

    getLocalResponse(message) {
        const msg = message.toLowerCase().trim();
        
        // Knowledge base about itself
        if (msg.includes('who are you') || msg.includes('your name')) {
            return `I'm ${this.name}, an AI chatbot created by ${this.owner}! 🤖`;
        }
        else if (msg.includes('owner') || msg.includes('creator') || msg.includes('rajola')) {
            return `My creator is ${this.owner}! You can contact them at ${this.phone} 📱`;
        }
        else if (msg.includes('channel') || msg.includes('whatsapp')) {
            return `Join my WhatsApp channel: ${this.channel} 📢`;
        }
        else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            const greetings = [
                `Hello! I'm ${this.name}. How can I help you today? 👋`,
                `Hi there! Great to chat with you! 😊`,
                `Hey! What's on your mind? I'm here to help!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        else if (msg.includes('how are you')) {
            return "I'm doing great, thanks for asking! Ready to help you! 😊";
        }
        else if (msg.includes('joke') || msg.includes('funny')) {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
                "What do you call a bear with no teeth? A gummy bear! 🐻"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        else if (msg.includes('time')) {
            return `Current time is ${new Date().toLocaleTimeString()} ⏰`;
        }
        else if (msg.includes('date')) {
            return `Today is ${new Date().toLocaleDateString()} 📅`;
        }
        else if (msg.includes('thank')) {
            return "You're welcome! Happy to help! 😊";
        }
        else if (msg.includes('bye') || msg.includes('goodbye')) {
            return "Goodbye! Feel free to chat with me anytime! 👋";
        }
        else if (msg.includes('help')) {
            return `I can help you with:
• General conversation
• Telling jokes 😄
• Time and date ⏰
• Information about ${this.owner}
• Answering questions
Just ask me anything!`;
        }
        else {
            // Default responses
            const defaultResponses = [
                `That's interesting! I'm ${this.name}, created by ${this.owner}. Tell me more!`,
                "I understand. How can I assist you further?",
                "Thanks for sharing! What else would you like to know?",
                "I'm here to help! Feel free to ask me anything.",
                `By the way, did you know my creator is ${this.owner}? 😊`
            ];
            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
    }

    async chat(message) {
        if (!message || message.trim() === '') {
            return "Please say something! 😊";
        }
        
        console.log(`🤖 User asked: "${message}"`);
        const response = await this.getResponse(message);
        console.log(`🤖 Venocyber responded: "${response}"`);
        return response;
    }
}

// Create global instance
window.venocyber = new VenocyberAI();
