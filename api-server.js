// venocyber-api.js - Fixed with correct Gemini model
// Created by rajola

class VenocyberAI {
    constructor() {
        this.name = "Venocyber-MD";
        this.owner = "rajola";
        this.phone = "+255676195192";
        this.channel = "https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P";
        
        // ✅ YOUR GEMINI API KEY
        this.geminiApiKey = "AIzaSyDDBlgeloXMaLwY3NftElc6EK7tIF3vTzE";
        
        // 🔥 FIXED: Use correct model names
        this.models = [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.0-pro"
        ];
        this.currentModelIndex = 0;
        
        console.log(`🤖 ${this.name} AI initializing...`);
    }

    async chat(message) {
        if (!message || message.trim() === '') {
            return "Please say something! 😊";
        }
        
        console.log(`🤖 Processing: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        
        // Try API with multiple models, fallback to local
        for (let i = 0; i < this.models.length; i++) {
            try {
                const response = await this.callGeminiAPI(message, this.models[i]);
                if (response && response.trim()) {
                    return response;
                }
            } catch (error) {
                console.log(`⚠️ Model ${this.models[i]} failed:`, error.message);
                // Continue to next model
            }
        }
        
        console.warn('⚠️ All API models failed, using fallback response');
        return this.getLocalResponse(message);
    }

    async callGeminiAPI(message, modelName) {
        if (!this.geminiApiKey) {
            throw new Error('No Gemini API key configured');
        }

        if (!this.geminiApiKey.startsWith('AIza')) {
            throw new Error('Invalid Gemini API key format');
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`;
        
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
            const response = await fetch(endpoint, {
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
                console.error(`API Response Error (${modelName}):`, response.status, errorData);
                
                if (response.status === 403) {
                    throw new Error('API key is invalid or has insufficient permissions');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded');
                } else if (response.status === 404) {
                    throw new Error(`Model ${modelName} not found`);
                } else {
                    throw new Error(`API error (${response.status})`);
                }
            }

            const data = await response.json();
            
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!responseText) {
                throw new Error('No response text in API response');
            }
            
            return responseText.trim();

        } catch (error) {
            throw error;
        }
    }

    getLocalResponse(message) {
        const msg = message.toLowerCase().trim();
        
        // Knowledge base with varied responses
        if (msg.includes('who are you') || msg.includes('your name')) {
            return `I'm ${this.name}, an AI chatbot created by ${this.owner}! 🤖`;
        }
        else if (msg.includes('owner') || msg.includes('creator') || msg.includes('rajola') || msg.includes('who made you')) {
            return `My creator is ${this.owner}! You can contact them at ${this.phone} 📱`;
        }
        else if (msg.includes('channel') || msg.includes('whatsapp') || msg.includes('group link')) {
            return `Join my WhatsApp channel: ${this.channel} 📢`;
        }
        else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            const greetings = [
                `Hello! I'm ${this.name}, created by ${this.owner}. How can I help you today? 👋`,
                `Hi there! Great to chat with you! I'm ${this.name} 😊`,
                `Hey! What can I do for you? I'm ${this.name}, created by ${this.owner}!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        else if (msg.includes('how are you')) {
            return "I'm doing great, thanks for asking! Ready to chat with you! 😊";
        }
        else if (msg.includes('joke') || msg.includes('funny')) {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything! 😄",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
                "What do you call a bear with no teeth? A gummy bear! 🐻",
                "Why don't eggs tell jokes? They'd crack each other up! 🥚"
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
        else if (msg.includes('help') || msg.includes('what can you do')) {
            return `I can help you with:\n• General conversation\n• Telling jokes 😄\n• Time and date ⏰\n• Information about ${this.owner}\n• Answering questions\nJust ask me anything!`;
        }
        else {
            const defaultResponses = [
                `That's interesting! Tell me more.`,
                "I understand. How can I assist you further?",
                "Thanks for sharing! What else would you like to know?",
                `By the way, I'm ${this.name} created by ${this.owner}!`,
                "I'm here to help! Feel free to ask me anything.",
                "Interesting! Can you elaborate a bit more?"
            ];
            return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }
    }

    async testAPI() {
        console.log('🧪 Testing Gemini API connection...');
        
        for (const model of this.models) {
            try {
                console.log(`Testing model: ${model}`);
                const response = await this.callGeminiAPI('Say "API is working" if you receive this', model);
                console.log(`✅ API test successful with ${model}:`, response);
                return { success: true, model, response };
            } catch (error) {
                console.log(`❌ ${model} failed:`, error.message);
            }
        }
        
        console.warn('⚠️ All API models failed, running in fallback mode');
        return { success: false, error: 'All models failed' };
    }
}

// Create global instance
window.venocyber = new VenocyberAI();

// Test API after 2 seconds
setTimeout(() => {
    if (window.venocyber) {
        window.venocyber.testAPI().then(result => {
            if (result.success) {
                console.log(`✅ Venocyber-MD AI is ready with working ${result.model}!`);
            } else {
                console.warn('⚠️ Venocyber-MD AI running in fallback mode (API unavailable)');
            }
        });
    }
}, 2000);

console.log('✅ Venocyber-MD AI script loaded');
