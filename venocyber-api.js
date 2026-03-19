// venocyber-api.js - Enhanced Version with Better Error Handling
// Created by rajola

class VenocyberAI {
    constructor() {
        this.name = "Venocyber-MD";
        this.owner = "rajola";
        this.phone = "+255676195192";
        this.channel = "https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P";
        
        // ✅ YOUR GEMINI API KEY
        this.geminiApiKey = "AIzaSyDDBlgeloXMaLwY3NftElc6EK7tIF3vTzE";
        
        // Updated to use the correct model
        this.geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        
        console.log(`🤖 ${this.name} AI initializing...`);
    }

    async chat(message) {
        if (!message || message.trim() === '') {
            return "Please say something! 😊";
        }
        
        console.log(`🤖 Processing: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        
        // Try API first, fallback to local if it fails
        try {
            const response = await this.callGeminiAPI(message);
            if (response && response.trim()) {
                return response;
            }
            throw new Error('Empty response from API');
        } catch (error) {
            console.warn('⚠️ Using fallback response:', error.message);
            return this.getLocalResponse(message);
        }
    }

    async callGeminiAPI(message) {
        if (!this.geminiApiKey) {
            throw new Error('No Gemini API key configured');
        }

        // Validate API key format
        if (!this.geminiApiKey.startsWith('AIza')) {
            throw new Error('Invalid Gemini API key format');
        }

        const systemPrompt = `You are Venocyber-MD, an AI chatbot created by rajola. 
Key information about you:
- Creator: rajola (WhatsApp: +255676195192)
- WhatsApp Channel: ${this.channel}

Guidelines:
1. Be friendly, concise, and helpful
2. Use emojis occasionally 😊
3. If asked about your creator, mention rajola
4. If asked about WhatsApp channel, share the link
5. Keep responses to 2-3 sentences max

User: ${message}
Assistant:`;

        try {
            const response = await fetch(`${this.geminiEndpoint}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150,
                        topP: 0.8,
                        topK: 40
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Response Error:', response.status, errorData);
                
                if (response.status === 403) {
                    throw new Error('API key is invalid or has insufficient permissions');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later');
                } else if (response.status === 400) {
                    throw new Error('Bad request - check API configuration');
                } else {
                    throw new Error(`API error (${response.status})`);
                }
            }

            const data = await response.json();
            
            // Extract response text safely
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!responseText) {
                throw new Error('No response text in API response');
            }
            
            return responseText.trim();

        } catch (error) {
            console.error('API call failed:', error);
            throw error; // Re-throw to trigger fallback
        }
    }

    getLocalResponse(message) {
        const msg = message.toLowerCase().trim();
        
        // Comprehensive local responses
        const responses = {
            // Identity questions
            identity: [
                `I'm ${this.name}, your AI assistant created by ${this.owner}! 🤖`,
                `I'm ${this.name}, here to help you! Created by ${this.owner} 😊`,
                `You're chatting with ${this.name}, an AI by ${this.owner}!`
            ],
            
            // Owner questions
            owner: [
                `My creator is ${this.owner}! You can reach them at ${this.phone} 📱`,
                `I was built by ${this.owner} to help people like you!`,
                `${this.owner} is the amazing person who created me!`
            ],
            
            // Channel questions
            channel: [
                `Join my WhatsApp channel: ${this.channel} 📢`,
                `Stay updated via my channel: ${this.channel}`,
                `Follow ${this.owner}'s channel for updates: ${this.channel}`
            ],
            
            // Greetings
            greetings: [
                `Hello! I'm ${this.name}. How can I help you today? 👋`,
                `Hi there! Great to chat with you! 😊`,
                `Hey! What can I do for you?`
            ],
            
            // How are you
            howAreYou: [
                "I'm doing great, thanks for asking! Ready to help! 😊",
                "All systems operational! How can I assist you?",
                "I'm wonderful! Thanks for checking in!"
            ],
            
            // Jokes
            jokes: [
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
                "What do you call a bear with no teeth? A gummy bear! 🐻",
                "Why don't eggs tell jokes? They'd crack each other up! 🥚"
            ],
            
            // Time/Date
            time: [
                `Current time: ${new Date().toLocaleTimeString()} ⏰`,
                `It's ${new Date().toLocaleTimeString()} right now`
            ],
            date: [
                `Today's date: ${new Date().toLocaleDateString()} 📅`,
                `It's ${new Date().toLocaleDateString()}`
            ],
            
            // Thanks
            thanks: [
                "You're welcome! Happy to help! 😊",
                "Anytime! That's what I'm here for!",
                "My pleasure! Feel free to ask anything else!"
            ],
            
            // Goodbye
            goodbye: [
                "Goodbye! Chat with me again soon! 👋",
                "Take care! Come back anytime!",
                "See you later! 😊"
            ],
            
            // Help
            help: [
                `I can help you with:\n• General conversation\n• Jokes 😄\n• Time & date ⏰\n• Info about ${this.owner}\n• Answering questions\nJust ask me anything!`,
                `Need help? I'm here for you! Ask me about:\n- Myself (${this.name})\n- My creator (${this.owner})\n- Jokes\n- Time/date\n- And more!`
            ],
            
            // Default responses
            default: [
                `That's interesting! Tell me more.`,
                "I understand. How can I assist you further?",
                "Thanks for sharing! What else would you like to know?",
                `By the way, I'm ${this.name} created by ${this.owner}!`,
                "I'm here to help! Feel free to ask me anything.",
                "Interesting! Can you elaborate?",
                "I appreciate your message! Is there something specific you'd like to know?"
            ]
        };

        // Check message patterns
        if (msg.includes('who are you') || msg.includes('your name')) {
            return this.randomFromArray(responses.identity);
        }
        if (msg.includes('owner') || msg.includes('creator') || msg.includes('rajola') || msg.includes('who made you')) {
            return this.randomFromArray(responses.owner);
        }
        if (msg.includes('channel') || msg.includes('whatsapp') || msg.includes('group')) {
            return this.randomFromArray(responses.channel);
        }
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greetings')) {
            return this.randomFromArray(responses.greetings);
        }
        if (msg.includes('how are you') || msg.includes('how do you do')) {
            return this.randomFromArray(responses.howAreYou);
        }
        if (msg.includes('joke') || msg.includes('funny') || msg.includes('laugh')) {
            return this.randomFromArray(responses.jokes);
        }
        if (msg.includes('time') || msg.includes('clock')) {
            return this.randomFromArray(responses.time);
        }
        if (msg.includes('date') || msg.includes('today')) {
            return this.randomFromArray(responses.date);
        }
        if (msg.includes('thank') || msg.includes('thanks')) {
            return this.randomFromArray(responses.thanks);
        }
        if (msg.includes('bye') || msg.includes('goodbye') || msg.includes('see you')) {
            return this.randomFromArray(responses.goodbye);
        }
        if (msg.includes('help') || msg.includes('support') || msg.includes('what can you do')) {
            return this.randomFromArray(responses.help);
        }
        
        return this.randomFromArray(responses.default);
    }

    randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Test method to verify API is working
    async testAPI() {
        console.log('🧪 Testing Gemini API connection...');
        try {
            const response = await this.callGeminiAPI('Say "API is working" if you receive this');
            console.log('✅ API test successful:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ API test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and expose global instance
window.venocyber = new VenocyberAI();

// Auto-test API on load (optional - comment out if not wanted)
setTimeout(() => {
    if (window.venocyber) {
        window.venocyber.testAPI().then(result => {
            if (result.success) {
                console.log('✅ Venocyber-MD AI is ready with working Gemini API!');
            } else {
                console.warn('⚠️ Venocyber-MD AI running in fallback mode (API unavailable)');
            }
        });
    }
}, 2000);

console.log('✅ Venocyber-MD AI script loaded');
