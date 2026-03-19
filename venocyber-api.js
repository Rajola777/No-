// venocyber-api.js - Complete with your Gemini API Key
// Created by rajola

class VenocyberAI {
    constructor() {
        this.name = "Venocyber-MD";
        this.owner = "rajola";
        this.phone = "+255676195192";
        this.channel = "https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P";
        
        // ✅ YOUR ACTUAL GEMINI API KEY
        this.geminiApiKey = "AIzaSyDDBlgeloXMaLwY3NftElc6EK7tIF3vTzE";
        this.geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
        this.model = "gemini-2.0-flash-exp"; // Fast model for chat
        
        console.log(`🤖 ${this.name} AI initialized with Gemini API`);
    }

    async chat(message) {
        if (!message || message.trim() === '') {
            return "Please say something! 😊";
        }
        
        console.log(`🤖 User asked: "${message}"`);
        
        try {
            // Try Gemini API first
            const response = await this.callGeminiAPI(message);
            return response;
        } catch (error) {
            console.error('❌ Gemini API error:', error);
            // Fallback to local responses if API fails
            return this.getLocalResponse(message);
        }
    }

    async callGeminiAPI(message) {
        if (!this.geminiApiKey) {
            throw new Error('No Gemini API key found');
        }

        // Create the prompt with Venocyber's identity
        const prompt = `You are Venocyber-MD, an AI chatbot created by rajola. 
Owner's WhatsApp: +255676195192
Owner's WhatsApp Channel: https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P

Important rules:
1. Always introduce yourself as Venocyber-MD when appropriate
2. Mention that rajola is your creator when asked
3. Share the WhatsApp channel link when users ask about it
4. Keep responses friendly, concise, and helpful (max 2-3 sentences)
5. Use emojis occasionally to be friendly 😊

User message: ${message}

Response:`;

        const response = await fetch(`${this.geminiEndpoint}?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                    topP: 0.9
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }
        
        throw new Error('Invalid API response structure');
    }

    getLocalResponse(message) {
        const msg = message.toLowerCase().trim();
        
        // Knowledge base
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
            return `Hello! I'm ${this.name}, created by ${this.owner}. How can I help you today? 👋`;
        }
        else if (msg.includes('how are you')) {
            return "I'm doing great, thanks for asking! Ready to chat with you! 😊";
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
            const defaultResponses = [
                `That's interesting! Tell me more.`,
                "I understand. How can I assist you further?",
                "Thanks for sharing! What else would you like to know?",
                `By the way, I'm ${this.name} created by ${this.owner}!`,
                "I'm here to help! Feel free to ask me anything."
            ];
            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
    }
}

// Create global instance
window.venocyber = new VenocyberAI();

console.log('✅ Venocyber-MD AI is ready with your Gemini API key!');
