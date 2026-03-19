// chat.js - Main Chat Application
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
// Add this at the top of your chat.js after imports

// ================= VENOCYBER AI INTEGRATION =================
// Load Venocyber AI
const venocyberScript = document.createElement('script');
venocyberScript.src = 'venocyber-api.js';
document.head.appendChild(venocyberScript);

// AI Chat state
let aiMessages = [];
let aiMessagesUnsubscribe = null;

// ================= MODIFIED SEND MESSAGE FUNCTION =================
async function sendMessage() {
    const content = msgInput ? msgInput.value.trim() : '';
    if (!content) return;
    
    // Check if it's an AI command
    if (content.startsWith('#ven ')) {
        const aiQuestion = content.substring(5).trim();
        await sendToVenocyber(aiQuestion);
        msgInput.value = '';
        return;
    }
    
    if (!currentChatId) {
        showToast('No active chat', 'error');
        return;
    }
    
    const message = {
        senderId: currentUser.uid,
        type: 'text',
        content: content,
        timestamp: serverTimestamp(),
        status: 'sent',
        replyTo: replyingTo ? replyingTo.content : null
    };
    
    try {
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), message);
        
        const chatRef = doc(db, 'chats', currentChatId);
        await updateDoc(chatRef, {
            lastMessage: message,
            lastMessageTime: serverTimestamp()
        });
        
        msgInput.value = '';
        clearReply();
        
        if (micBtn && sendBtn) {
            micBtn.classList.remove('hidden');
            sendBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// ================= SEND TO VENOCYBER AI =================
async function sendToVenocyber(question) {
    if (!question) return;
    
    // Show user message in chat
    const userMessageEl = createAIMessage(question, 'user');
    document.getElementById('ai-messages').appendChild(userMessageEl);
    
    // Save to local storage
    saveAIMessage(question, 'user');
    
    // Show typing indicator
    showAITyping(true);
    
    try {
        // Wait for Venocyber to be loaded
        if (!window.venocyber) {
            await new Promise(resolve => {
                const checkVenocyber = setInterval(() => {
                    if (window.venocyber) {
                        clearInterval(checkVenocyber);
                        resolve();
                    }
                }, 100);
            });
        }
        
        // Get AI response
        const response = await window.venocyber.chat(question);
        
        // Hide typing indicator
        showAITyping(false);
        
        // Show AI response
        const aiMessageEl = createAIMessage(response, 'ai');
        document.getElementById('ai-messages').appendChild(aiMessageEl);
        
        // Save to local storage
        saveAIMessage(response, 'ai');
        
        // Scroll to bottom
        const aiMessages = document.getElementById('ai-messages');
        aiMessages.scrollTop = aiMessages.scrollHeight;
        
    } catch (error) {
        console.error('AI Error:', error);
        showAITyping(false);
        showToast('Failed to get AI response', 'error');
    }
}

// ================= CREATE AI MESSAGE ELEMENT =================
function createAIMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender === 'ai' ? 'ai-message' : 'user-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    return messageDiv;
}

// ================= SHOW AI TYPING INDICATOR =================
function showAITyping(show) {
    const aiMessages = document.getElementById('ai-messages');
    if (!aiMessages) return;
    
    let typingIndicator = document.getElementById('ai-typing');
    
    if (show) {
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.id = 'ai-typing';
            typingIndicator.className = 'message ai-message typing';
            typingIndicator.innerHTML = `
                <div class="message-content">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            `;
            aiMessages.appendChild(typingIndicator);
        }
    } else {
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// ================= SAVE AI MESSAGE TO LOCAL STORAGE =================
function saveAIMessage(content, sender) {
    aiMessages.push({
        content,
        sender,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 messages
    if (aiMessages.length > 50) {
        aiMessages = aiMessages.slice(-50);
    }
    
    localStorage.setItem('aiMessages', JSON.stringify(aiMessages));
}

// ================= LOAD AI MESSAGES =================
function loadAIMessages() {
    const saved = localStorage.getItem('aiMessages');
    if (saved) {
        aiMessages = JSON.parse(saved);
        
        const aiMessagesContainer = document.getElementById('ai-messages');
        aiMessagesContainer.innerHTML = '';
        
        aiMessages.forEach(msg => {
            const el = createAIMessage(msg.content, msg.sender);
            aiMessagesContainer.appendChild(el);
        });
    }
}

// ================= CLEAR AI CHAT =================
function clearAIChat() {
    aiMessages = [];
    localStorage.removeItem('aiMessages');
    
    const aiMessagesContainer = document.getElementById('ai-messages');
    aiMessagesContainer.innerHTML = `
        <div class="message ai-message">
            <div class="message-content">
                Hello! I'm Venocyber-MD, your AI assistant created by rajola. How can I help you today?
            </div>
            <div class="message-time">Just now</div>
        </div>
    `;
    
    showToast('AI chat cleared', 'success');
}

// ================= MENU FUNCTIONS =================
function showMenu() {
    const menuModal = document.getElementById('menu-modal');
    const menuProfilePic = document.getElementById('menu-profile-pic');
    const menuUserName = document.getElementById('menu-user-name');
    const menuUserEmail = document.getElementById('menu-user-email');
    
    if (currentUser) {
        menuProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/80';
        menuUserName.textContent = currentUser.displayName;
        menuUserEmail.textContent = currentUser.email;
    }
    
    menuModal.classList.remove('hidden');
}

function showProfile() {
    closeModals();
    
    const profileModal = document.getElementById('profile-modal');
    const profilePic = document.getElementById('profile-modal-pic');
    const profileName = document.getElementById('profile-modal-name');
    const profileEmail = document.getElementById('profile-modal-email');
    const profilePhone = document.getElementById('profile-modal-phone');
    const profileJoined = document.getElementById('profile-modal-joined');
    
    if (currentUser) {
        profilePic.src = currentUser.photoURL || 'https://via.placeholder.com/100';
        profileName.textContent = currentUser.displayName;
        profileEmail.textContent = currentUser.email;
        
        // Get phone from localStorage if available
        const savedUser = JSON.parse(localStorage.getItem('crunkUser') || '{}');
        if (savedUser.phone) {
            profilePhone.textContent = savedUser.phone;
        }
        
        // Format join date
        if (currentUser.metadata?.createdAt) {
            const joined = new Date(currentUser.metadata.createdAt);
            profileJoined.textContent = `Joined ${joined.toLocaleDateString()}`;
        }
    }
    
    profileModal.classList.remove('hidden');
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    showToast(`Theme switched to ${isLight ? 'light' : 'dark'} mode`, 'success');
}

function shareApp() {
    const shareText = `Join me on Crunk Chat! 🎮\nChat with friends and use Venocyber-MD AI created by rajola!`;
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
        navigator.share({
            title: 'Crunk Chat',
            text: shareText,
            url: shareUrl
        }).catch(() => {
            copyToClipboard(shareUrl);
        });
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
}

function openSettings() {
    showToast('Settings coming soon!', 'info');
    closeModals();
}

// ================= GROUP FUNCTIONS =================
async function loadGroups() {
    if (!currentUser) return;
    
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', currentUser.uid));
    
    onSnapshot(q, (snapshot) => {
        const groups = [];
        snapshot.forEach(doc => {
            groups.push({ id: doc.id, ...doc.data() });
        });
        renderGroups(groups);
    });
}

function renderGroups(groups) {
    const groupsList = document.getElementById('groups-list');
    const emptyGroups = document.getElementById('empty-groups');
    
    if (groups.length === 0) {
        groupsList.innerHTML = '';
        emptyGroups.style.display = 'flex';
        return;
    }
    
    emptyGroups.style.display = 'none';
    groupsList.innerHTML = '';
    
    groups.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'group-item';
        groupEl.onclick = () => openGroupChat(group);
        groupEl.innerHTML = `
            <div class="group-avatar">
                ${group.photoURL ? `<img src="${group.photoURL}" alt="${group.name}">` : 
                  `<i class="fas fa-users"></i>`}
            </div>
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-members">${group.members.length} members</div>
                <div class="group-last-message">${group.lastMessage?.content || 'No messages yet'}</div>
            </div>
        `;
        groupsList.appendChild(groupEl);
    });
}

function showCreateGroupModal() {
    const modal = document.getElementById('group-modal');
    const memberSelection = document.getElementById('member-selection');
    
    // Populate members
    memberSelection.innerHTML = '';
    allUsers.forEach(user => {
        const memberEl = document.createElement('div');
        memberEl.className = 'member-item';
        memberEl.innerHTML = `
            <input type="checkbox" value="${user.uid}" id="member-${user.uid}">
            <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="${user.displayName}">
            <div class="member-info">
                <div class="member-name">${user.displayName}</div>
                <div class="member-status">${onlineUsers.has(user.uid) ? 'Online' : 'Offline'}</div>
            </div>
        `;
        memberSelection.appendChild(memberEl);
    });
    
    modal.classList.remove('hidden');
}

async function createGroup() {
    const groupName = document.getElementById('group-name').value.trim();
    const groupImage = document.getElementById('group-image').files[0];
    const selectedMembers = [];
    
    document.querySelectorAll('#member-selection input:checked').forEach(cb => {
        selectedMembers.push(cb.value);
    });
    
    if (!groupName) {
        showToast('Please enter a group name', 'error');
        return;
    }
    
    if (selectedMembers.length === 0) {
        showToast('Please select at least one member', 'error');
        return;
    }
    
    // Add current user
    selectedMembers.push(currentUser.uid);
    
    showLoading(true);
    
    try {
        let groupPhotoURL = null;
        
        // Upload group image if provided
        if (groupImage && supabase) {
            const fileExt = groupImage.name.split('.').pop();
            const fileName = `groups/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('group-images')
                .upload(fileName, groupImage);
                
            if (!error) {
                const { data: { publicUrl } } = supabase.storage
                    .from('group-images')
                    .getPublicUrl(fileName);
                groupPhotoURL = publicUrl;
            }
        }
        
        // Create group in Firestore
        const groupRef = await addDoc(collection(db, 'groups'), {
            name: groupName,
            photoURL: groupPhotoURL,
            members: selectedMembers,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp(),
            lastMessage: null,
            lastMessageTime: serverTimestamp()
        });
        
        // Create initial group chat
        await addDoc(collection(db, 'chats'), {
            type: 'group',
            groupId: groupRef.id,
            groupName: groupName,
            groupPhotoURL: groupPhotoURL,
            participants: selectedMembers,
            createdAt: serverTimestamp(),
            lastMessage: null,
            lastMessageTime: serverTimestamp()
        });
        
        showToast('Group created successfully!', 'success');
        closeModals();
        
        // Switch to groups tab
        switchTab('groups');
        
    } catch (error) {
        console.error('Error creating group:', error);
        showToast('Failed to create group', 'error');
    } finally {
        showLoading(false);
    }
}

// ================= EVENT LISTENERS =================
// Add these to your existing event listeners

// Menu toggle
document.getElementById('menu-toggle')?.addEventListener('click', showMenu);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModals();
    }
});

// AI Tab
document.getElementById('tab-ai')?.addEventListener('click', () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-ai').classList.add('active');
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('ai-view').classList.add('active');
    loadAIMessages();
});

// AI Send
document.getElementById('ai-send-btn')?.addEventListener('click', () => {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    if (message) {
        sendToVenocyber(message);
        input.value = '';
    }
});

document.getElementById('ai-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        if (message) {
            sendToVenocyber(message);
            input.value = '';
        }
    }
});

// Clear AI chat
document.getElementById('clear-ai-chat')?.addEventListener('click', clearAIChat);

// Groups tab
document.getElementById('tab-groups')?.addEventListener('click', () => {
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-groups').classList.add('active');
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('groups-view').classList.add('active');
    loadGroups();
});

// Create group button
document.getElementById('create-group-btn')?.addEventListener('click', showCreateGroupModal);

// Online/All filter
document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-option').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        
        const filter = e.target.dataset.filter;
        if (filter === 'online') {
            const onlineUsersList = allUsers.filter(user => onlineUsers.has(user.uid));
            renderContacts(onlineUsersList);
        } else {
            renderContacts(allUsers);
        }
    });
});

// ================= UPDATE PROFILE PICTURE =================
// Add this to your onAuthStateChanged
function updateProfileUI() {
    if (currentUser && headerProfilePic) {
        headerProfilePic.src = currentUser.photoURL || 'https://via.placeholder.com/32';
    }
}

// ================= LOAD THEME =================
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
}

// ================= EXPOSE FUNCTIONS GLOBALLY =================
window.switchTab = function(tab) {
    const tabs = {
        'chats': 'tab-chats',
        'contacts': 'tab-contacts',
        'groups': 'tab-groups',
        'ai': 'tab-ai'
    };
    
    if (tabs[tab]) {
        document.getElementById(tabs[tab])?.click();
    }
};

window.showProfile = showProfile;
window.toggleTheme = toggleTheme;
window.shareApp = shareApp;
window.openSettings = openSettings;
window.closeModals = closeModals;
window.logout = logout;
window.createGroup = createGroup;

console.log('✅ Venocyber-MD AI integrated successfully!');
// ================= FIREBASE CONFIG =================
// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7",
    measurementId: "G-7ZQ20HK4SD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ================= SUPABASE STORAGE SETUP =================
const SUPABASE_URL = 'https://rsrrxgqxwzrtzdecynay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gzEk7xu97MGfvNz4720mnA_m_h_RP9H';

// Initialize Supabase client (make sure to include the script in HTML)
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ================= DOM ELEMENTS =================
// Home Screen
const homeScreen = document.getElementById('home-screen');
const chatScreen = document.getElementById('chat-screen');
const profileBadge = document.getElementById('profile-badge');
const headerProfilePic = document.getElementById('header-profile-pic');
const searchToggle = document.getElementById('search-toggle');
const searchBar = document.getElementById('search-bar');
const globalSearch = document.getElementById('global-search');
const clearSearch = document.getElementById('clear-search');

// Tabs
const tabChats = document.getElementById('tab-chats');
const tabContacts = document.getElementById('tab-contacts');
const tabCalls = document.getElementById('tab-calls');
const chatsView = document.getElementById('chats-view');
const contactsView = document.getElementById('contacts-view');
const callsView = document.getElementById('calls-view');

// Lists
const recentChatsList = document.getElementById('recent-chats-list');
const userList = document.getElementById('user-list');
const callsList = document.getElementById('calls-list');

// Empty States
const emptyChats = document.getElementById('empty-chats');
const emptyCalls = document.getElementById('empty-calls');

// Chat Screen Elements
const backBtn = document.getElementById('back-btn');
const chatAvatar = document.getElementById('chat-avatar');
const chatWithName = document.getElementById('chat-with-name');
const chatStatusIndicator = document.getElementById('chat-status-indicator');
const chatStatusText = document.getElementById('chat-status-text');
const typingIndicator = document.getElementById('typing-indicator');
const messageBox = document.getElementById('message-box');
const msgInput = document.getElementById('msg-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const attachBtn = document.getElementById('attach-btn');
const imageUpload = document.getElementById('image-upload');
const fileUpload = document.getElementById('file-upload');
const emojiBtn = document.getElementById('emoji-btn');
const fileBtn = document.getElementById('file-btn');
const cameraBtn = document.getElementById('camera-btn');
const voiceCallBtn = document.getElementById('voice-call-btn');
const videoCallBtn = document.getElementById('video-call-btn');
const chatMenuBtn = document.getElementById('chat-menu-btn');

// Reply Preview
const replyPreview = document.getElementById('reply-preview');
const replyName = document.getElementById('reply-name');
const replyText = document.getElementById('reply-text');
const closeReply = document.getElementById('close-reply');

// Image Modal
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const closeModal = document.querySelector('.close-modal');

// Toast & Loading
const toastContainer = document.getElementById('toast-container');
const loadingOverlay = document.getElementById('loading-overlay');

// Invite Button
const inviteBtn = document.getElementById('invite-btn');

// ================= STATE MANAGEMENT =================
let currentUser = null;
let currentChatUser = null;
let currentChatId = null;
let messagesUnsubscribe = null;
let usersUnsubscribe = null;
let chatsUnsubscribe = null;
let typingTimeout = null;
let replyingTo = null;
let onlineUsers = new Set();
let allUsers = [];

// ================= HELPER FUNCTIONS =================
function safeToDate(timestamp) {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
}

function formatTime(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function formatDate(date) {
    if (!date) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
}

function scrollToBottom() {
    if (messageBox) {
        messageBox.scrollTop = messageBox.scrollHeight;
    }
}

function showToast(message, type = 'info') {
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }, 100);
}

function showLoading(show) {
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
}

function clearReply() {
    replyingTo = null;
    if (replyPreview) {
        replyPreview.classList.add('hidden');
    }
}

function openImageModal(url) {
    if (!imageModal || !modalImage) return;
    modalImage.src = url;
    imageModal.classList.add('active');
}

// ================= SUPABASE UPLOAD FUNCTION =================
async function uploadImageToSupabase(file, chatId) {
    if (!supabase) {
        showToast('Supabase not initialized. Check if the script is loaded.', 'error');
        return null;
    }
    
    try {
        showLoading(true);
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${chatId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('chat-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) throw error;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(fileName);
            
        return publicUrl;
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Failed to upload image: ' + error.message, 'error');
        return null;
    } finally {
        showLoading(false);
    }
}

// ================= AUTHENTICATION =================
// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        currentUser = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL || 'https://via.placeholder.com/100'
        };
        
        // Save user to Firestore
        await saveUserToFirestore(currentUser);
        
        // Update UI
        updateProfileUI();
        
        // Load initial data
        loadUsers();
        loadRecentChats();
        setupPresence();
        
        console.log('User logged in:', currentUser.displayName);
    } else {
        // No user, redirect to login
        window.location.href = 'index.html';
    }
});

// Save user to Firestore
async function saveUserToFirestore(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastSeen: serverTimestamp(),
                status: 'online',
                createdAt: serverTimestamp()
            });
        } else {
            await updateDoc(userRef, {
                lastSeen: serverTimestamp(),
                status: 'online'
            });
        }
    } catch (error) {
        console.error('Error saving user:', error);
    }
}

// Update profile UI
function updateProfileUI() {
    if (currentUser && headerProfilePic) {
        headerProfilePic.src = currentUser.photoURL;
    }
}

// Setup presence system
function setupPresence() {
    if (!currentUser) return;
    
    const userStatusRef = doc(db, 'users', currentUser.uid);
    
    // Update status when window closes
    window.addEventListener('beforeunload', () => {
        updateDoc(userStatusRef, {
            status: 'offline',
            lastSeen: serverTimestamp()
        });
    });
    
    // Set online status
    updateDoc(userStatusRef, {
        status: 'online',
        lastSeen: serverTimestamp()
    });
    
    // Listen for online users
    const usersRef = collection(db, 'users');
    onSnapshot(usersRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const userData = change.doc.data();
            if (change.type === 'added' || change.type === 'modified') {
                if (userData.status === 'online') {
                    onlineUsers.add(change.doc.id);
                } else {
                    onlineUsers.delete(change.doc.id);
                }
            }
        });
        updateUserStatusIndicators();
    });
}

// ================= LOAD USERS =================
function loadUsers() {
    if (!currentUser) return;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    
    if (usersUnsubscribe) usersUnsubscribe();
    
    usersUnsubscribe = onSnapshot(q, (snapshot) => {
        const users = [];
        snapshot.forEach((doc) => {
            if (doc.id !== currentUser.uid) {
                users.push({ id: doc.id, ...doc.data() });
            }
        });
        allUsers = users;
        renderContacts(users);
    });
}

// Render contacts
function renderContacts(users) {
    if (!userList) return;
    
    if (users.length === 0) {
        userList.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
        return;
    }
    
    userList.innerHTML = '';
    users.forEach(user => {
        const isOnline = onlineUsers.has(user.uid);
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.setAttribute('data-userid', user.uid);
        contactEl.onclick = () => openChat(user);
        contactEl.innerHTML = `
            <img src="${user.photoURL || 'https://via.placeholder.com/56'}" 
                 alt="${user.displayName}" 
                 class="contact-avatar ${isOnline ? 'online' : ''}">
            <div class="contact-info">
                <div class="contact-name">
                    ${user.displayName}
                    ${isOnline ? '<span class="status-indicator online"></span>' : ''}
                </div>
                <div class="contact-status">${isOnline ? 'Online' : 'Offline'}</div>
            </div>
        `;
        userList.appendChild(contactEl);
    });
}

// Update status indicators
function updateUserStatusIndicators() {
    // Update contacts list
    document.querySelectorAll('.contact-item').forEach(item => {
        const userId = item.getAttribute('data-userid');
        const avatar = item.querySelector('.contact-avatar');
        const nameEl = item.querySelector('.contact-name');
        const statusEl = item.querySelector('.contact-status');
        
        if (userId && onlineUsers.has(userId)) {
            if (avatar) avatar.classList.add('online');
            if (nameEl) {
                if (!nameEl.querySelector('.status-indicator')) {
                    nameEl.innerHTML += '<span class="status-indicator online"></span>';
                }
            }
            if (statusEl) statusEl.textContent = 'Online';
        } else {
            if (avatar) avatar.classList.remove('online');
            if (nameEl) {
                const indicator = nameEl.querySelector('.status-indicator');
                if (indicator) indicator.remove();
            }
            if (statusEl) statusEl.textContent = 'Offline';
        }
    });
    
    // Update chat list online indicators
    document.querySelectorAll('.chat-item').forEach(item => {
        const avatar = item.querySelector('.chat-avatar');
        // Online status is handled by the class already from render
    });
}

// ================= LOAD RECENT CHATS =================
function loadRecentChats() {
    if (!currentUser) return;
    
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef, 
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
    );
    
    if (chatsUnsubscribe) chatsUnsubscribe();
    
    chatsUnsubscribe = onSnapshot(q, (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
        });
        renderRecentChats(chats);
    });
}

// Render recent chats
async function renderRecentChats(chats) {
    if (!recentChatsList) return;
    
    if (chats.length === 0) {
        if (emptyChats) emptyChats.classList.remove('hidden');
        recentChatsList.innerHTML = '';
        return;
    }
    
    if (emptyChats) emptyChats.classList.add('hidden');
    recentChatsList.innerHTML = '';
    
    for (const chat of chats) {
        const otherUserId = chat.participants.find(id => id !== currentUser.uid);
        if (!otherUserId) continue;
        
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const otherUser = userDoc.data();
        
        if (!otherUser) continue;
        
        const isOnline = onlineUsers.has(otherUserId);
        const lastMessageTime = safeToDate(chat.lastMessageTime);
        
        const chatEl = document.createElement('div');
        chatEl.className = 'chat-item';
        chatEl.setAttribute('data-chatid', chat.id);
        chatEl.onclick = () => openChat(otherUser, chat.id);
        chatEl.innerHTML = `
            <img src="${otherUser.photoURL || 'https://via.placeholder.com/56'}" 
                 alt="${otherUser.displayName}" 
                 class="chat-avatar ${isOnline ? 'online' : ''}">
            <div class="chat-info">
                <div class="chat-name">
                    ${otherUser.displayName}
                    ${isOnline ? '<span class="status-indicator online"></span>' : ''}
                </div>
                <div class="chat-last-message">
                    ${chat.lastMessage?.type === 'text' ? chat.lastMessage.content : 'Media message'}
                </div>
            </div>
            <div class="chat-time">${formatTime(lastMessageTime)}</div>
            ${chat.unreadCount ? `<span class="unread-badge">${chat.unreadCount}</span>` : ''}
        `;
        recentChatsList.appendChild(chatEl);
    }
}

// ================= OPEN CHAT =================
async function openChat(user, existingChatId = null) {
    if (!currentUser || !user) return;
    
    currentChatUser = user;
    
    // Update UI
    if (chatAvatar) chatAvatar.src = user.photoURL || 'https://via.placeholder.com/56';
    if (chatWithName) chatWithName.textContent = user.displayName;
    
    // Check online status
    const isOnline = onlineUsers.has(user.uid);
    if (chatStatusIndicator) {
        chatStatusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    }
    if (chatStatusText) chatStatusText.textContent = isOnline ? 'Online' : 'Offline';
    
    // Get or create chat
    if (existingChatId) {
        currentChatId = existingChatId;
    } else {
        currentChatId = await getOrCreateChat(user.uid);
    }
    
    // Switch to chat screen
    if (homeScreen) homeScreen.classList.remove('active');
    if (chatScreen) chatScreen.classList.add('active');
    
    // Load messages
    loadMessages(currentChatId);
    
    // Mark messages as read
    markChatAsRead(currentChatId);
}

// Get or create chat
async function getOrCreateChat(otherUserId) {
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(q);
    let existingChat = null;
    
    querySnapshot.forEach((doc) => {
        const chat = doc.data();
        if (chat.participants.includes(otherUserId)) {
            existingChat = doc.id;
        }
    });
    
    if (existingChat) {
        return existingChat;
    }
    
    // Create new chat
    const newChatRef = await addDoc(collection(db, 'chats'), {
        participants: [currentUser.uid, otherUserId],
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: serverTimestamp(),
        unreadCount: 0
    });
    
    return newChatRef.id;
}

// ================= LOAD MESSAGES =================
function loadMessages(chatId) {
    if (messagesUnsubscribe) messagesUnsubscribe();
    if (!chatId) return;
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        renderMessages(messages);
        scrollToBottom();
    });
}

// Render messages
function renderMessages(messages) {
    if (!messageBox) return;
    
    messageBox.innerHTML = '';
    
    if (messages.length === 0) {
        messageBox.innerHTML = '<div class="empty-state"><p>No messages yet. Say hello!</p></div>';
        return;
    }
    
    let lastDate = null;
    
    messages.forEach((message) => {
        const messageDate = safeToDate(message.timestamp);
        const messageDay = messageDate ? messageDate.toDateString() : null;
        
        // Add date separator
        if (messageDay && messageDay !== lastDate) {
            const dateSeparator = document.createElement('div');
            dateSeparator.className = 'date-separator';
            dateSeparator.innerHTML = `<span>${formatDate(messageDate)}</span>`;
            messageBox.appendChild(dateSeparator);
            lastDate = messageDay;
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
        messageEl.dataset.id = message.id;
        
        if (message.type === 'text') {
            messageEl.innerHTML = `
                <div class="message-content">
                    ${message.replyTo ? `<div class="reply-preview-mini">Replying to: ${message.replyTo}</div>` : ''}
                    ${message.content || ''}
                </div>
                <div class="message-info">
                    <span class="message-time">${formatTime(messageDate)}</span>
                    ${message.senderId === currentUser.uid ? `
                        <span class="message-status ${message.status || 'sent'}">
                            ${message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                    ` : ''}
                </div>
            `;
        } else if (message.type === 'image') {
            messageEl.innerHTML = `
                <div class="message-content">
                    ${message.replyTo ? `<div class="reply-preview-mini">Replying to: ${message.replyTo}</div>` : ''}
                    <img src="${message.url}" class="message-image" onclick='openImageModal("${message.url}")' style="max-width: 200px; max-height: 200px; border-radius: 8px; cursor: pointer;">
                </div>
                <div class="message-info">
                    <span class="message-time">${formatTime(messageDate)}</span>
                    ${message.senderId === currentUser.uid ? `
                        <span class="message-status ${message.status || 'sent'}">
                            ${message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                    ` : ''}
                </div>
            `;
        }
        
        messageBox.appendChild(messageEl);
    });
}

// ================= SEND MESSAGE =================
async function sendMessage() {
    const content = msgInput ? msgInput.value.trim() : '';
    if (!content && !replyingTo) return;
    if (!currentChatId) {
        showToast('No active chat', 'error');
        return;
    }
    
    const message = {
        senderId: currentUser.uid,
        type: 'text',
        content: content,
        timestamp: serverTimestamp(),
        status: 'sent',
        replyTo: replyingTo ? replyingTo.content : null
    };
    
    try {
        // Add message to Firestore
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), message);
        
        // Update chat last message
        const chatRef = doc(db, 'chats', currentChatId);
        await updateDoc(chatRef, {
            lastMessage: message,
            lastMessageTime: serverTimestamp()
        });
        
        // Clear input
        if (msgInput) msgInput.value = '';
        
        // Clear reply
        clearReply();
        
        // Show mic button, hide send button
        if (micBtn && sendBtn) {
            micBtn.classList.remove('hidden');
            sendBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// ================= SEND IMAGE WITH SUPABASE =================
async function sendImage(file) {
    if (!file || !currentChatId) {
        showToast('No active chat or file', 'error');
        return;
    }
    
    // Upload to Supabase
    const imageUrl = await uploadImageToSupabase(file, currentChatId);
    
    if (!imageUrl) return;
    
    // Send message with image URL (store in Firestore)
    const message = {
        senderId: currentUser.uid,
        type: 'image',
        url: imageUrl,
        filename: file.name,
        timestamp: serverTimestamp(),
        status: 'sent'
    };
    
    try {
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), message);
        
        // Update chat last message
        await updateDoc(doc(db, 'chats', currentChatId), {
            lastMessage: message,
            lastMessageTime: serverTimestamp()
        });
        
        showToast('Image sent', 'success');
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// ================= MARK AS READ =================
async function markChatAsRead(chatId) {
    if (!chatId) return;
    
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
        unreadCount: 0
    });
    
    // Update message status
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('status', '==', 'delivered'));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
            status: 'read'
        });
    });
}

// ================= EVENT LISTENERS =================
// Tab switching
if (tabChats) {
    tabChats.addEventListener('click', () => {
        document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
        tabChats.classList.add('active');
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        if (chatsView) chatsView.classList.add('active');
    });
}

if (tabContacts) {
    tabContacts.addEventListener('click', () => {
        document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
        tabContacts.classList.add('active');
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        if (contactsView) contactsView.classList.add('active');
    });
}

if (tabCalls) {
    tabCalls.addEventListener('click', () => {
        document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
        tabCalls.classList.add('active');
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        if (callsView) callsView.classList.add('active');
    });
}

// Back button
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (chatScreen) chatScreen.classList.remove('active');
        if (homeScreen) homeScreen.classList.add('active');
        if (messagesUnsubscribe) messagesUnsubscribe();
    });
}

// Send message
if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
}

if (msgInput) {
    msgInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    msgInput.addEventListener('input', () => {
        // Show send button when typing
        if (msgInput.value.trim()) {
            if (micBtn) micBtn.classList.add('hidden');
            if (sendBtn) sendBtn.classList.remove('hidden');
        } else {
            if (micBtn) micBtn.classList.remove('hidden');
            if (sendBtn) sendBtn.classList.add('hidden');
        }
        // Send typing indicator
if (currentChatId) {
    if (typingIndicator) {
        typingIndicator.style.display = 'inline';
        typingIndicator.textContent = 'typing...';
    }
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    typingTimeout = setTimeout(() => {
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }, 1500); // Hide after 1.5 seconds of no typing
}
        
    
}

// Image upload
if (imageUpload) {
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file', 'error');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error');
                return;
            }
            
            await sendImage(file);
            
            // Clear input
            imageUpload.value = '';
        }
    });
}

// Attach button
if (attachBtn) {
    attachBtn.addEventListener('click', () => {
        if (imageUpload) imageUpload.click();
    });
}

// Close modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (imageModal) imageModal.classList.remove('active');
    });
}

if (imageModal) {
    window.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.classList.remove('active');
        }
    });
}

// Search toggle
if (searchToggle && searchBar) {
    searchToggle.addEventListener('click', () => {
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden') && globalSearch) {
            globalSearch.focus();
        }
    });
}

// Clear search
if (clearSearch && globalSearch) {
    clearSearch.addEventListener('click', () => {
        globalSearch.value = '';
        renderContacts(allUsers);
    });
}

// Search functionality
if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query) {
            const filtered = allUsers.filter(user => 
                user.displayName && user.displayName.toLowerCase().includes(query)
            );
            renderContacts(filtered);
        } else {
            renderContacts(allUsers);
        }
    });
}

// Invite button
if (inviteBtn) {
    inviteBtn.addEventListener('click', () => {
        const inviteText = `Join me on Crunk Chat!`;
        if (navigator.share) {
            navigator.share({
                title: 'Crunk Chat',
                text: inviteText,
                url: window.location.origin
            }).catch(() => {
                navigator.clipboard.writeText(window.location.origin);
                showToast('Link copied to clipboard!', 'success');
            });
        } else {
            navigator.clipboard.writeText(window.location.origin);
            showToast('Link copied to clipboard!', 'success');
        }
    });
}

// Close reply
if (closeReply) {
    closeReply.addEventListener('click', clearReply);
}

// ================= TEST SUPABASE CONNECTION =================
async function testSupabase() {
    if (!supabase) {
        console.warn('⚠️ Supabase not initialized. Make sure to include the Supabase script in HTML.');
        return;
    }
    
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        console.log('✅ Supabase connected! Buckets:', data);
        showToast('Supabase connected', 'success');
    } catch (error) {
        console.error('❌ Supabase error:', error);
        showToast('Supabase connection failed', 'error');
    }
}

// Run test after a short delay
setTimeout(testSupabase, 2000);

// ================= EXPOSE GLOBALLY =================
window.switchTab = (tab) => {
    if (tab === 'contacts' && tabContacts) {
        tabContacts.click();
    }
};

window.openImageModal = openImageModal;
window.sendMessage = sendMessage;

console.log('✅ Chat app initialized successfully');
window.updateUserStatus = function(status) {
    console.log('User status changed to:', status);
    // This will be handled by your Firebase presence system
    // You can dispatch a custom event that your chat.js listens to
    window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: { status } }));
};
// ================= LOGOUT =================
window.logout = async function() {
    try {
        await signOut(auth);
        localStorage.removeItem('crunkUser');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to logout', 'error');
    }
};
// Add this to your chatting app
async function chatWithVenocyber(message) {
    try {
        const response = await fetch('http://localhost:3000/api/venocyber/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error:', error);
        return "Sorry, I'm having trouble connecting. Please try again!";
    }
}

// Modify your existing message handler
async function onMessageSend(message) {
    // Display user message
    addMessageToChat('user', message);
    
    // Get bot response
    const botResponse = await chatWithVenocyber(message);
    
    // Display bot message
    addMessageToChat('bot', botResponse);
}
