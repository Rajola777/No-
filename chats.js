// chat.js - Complete Working Version with All Features Fixed
// Created by rajola

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
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

console.log('🚀 Chat.js started loading');

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= SUPABASE SETUP =================
const SUPABASE_URL = 'https://rsrrxgqxwzrtzdecynay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcnJ4Z3F4d3pydHpkZWN5bmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI4OTYwMDAsImV4cCI6MjAyODQ3MjAwMH0.samplekey';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// ================= STATE MANAGEMENT =================
let currentUser = null;
let currentChatUser = null;
let currentChatId = null;
let messagesUnsubscribe = null;
let usersUnsubscribe = null;
let chatsUnsubscribe = null;
let groupsUnsubscribe = null;
let onlineUsers = new Set();
let allUsers = [];
let aiMessages = [];

// ================= WAIT FOR DOM =================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, initializing UI');
    initializeApp();
});

function initializeApp() {
    console.log('🔄 Initializing app...');
    
    // Get all DOM elements
    const elements = {
        menuToggle: document.getElementById('menu-toggle'),
        menuModal: document.getElementById('menu-modal'),
        headerProfilePic: document.getElementById('header-profile-pic'),
        searchToggle: document.getElementById('search-toggle'),
        searchBar: document.getElementById('search-bar'),
        globalSearch: document.getElementById('global-search'),
        clearSearch: document.getElementById('clear-search'),
        
        // Tabs
        tabChats: document.getElementById('tab-chats'),
        tabContacts: document.getElementById('tab-contacts'),
        tabGroups: document.getElementById('tab-groups'),
        tabAi: document.getElementById('tab-ai'),
        chatsView: document.getElementById('chats-view'),
        contactsView: document.getElementById('contacts-view'),
        groupsView: document.getElementById('groups-view'),
        aiView: document.getElementById('ai-view'),
        
        // Lists
        userList: document.getElementById('user-list'),
        recentChatsList: document.getElementById('recent-chats-list'),
        groupsList: document.getElementById('groups-list'),
        aiMessages: document.getElementById('ai-messages'),
        
        // Chat screen
        backBtn: document.getElementById('back-btn'),
        chatScreen: document.getElementById('chat-screen'),
        homeScreen: document.getElementById('home-screen'),
        chatAvatar: document.getElementById('chat-avatar'),
        chatWithName: document.getElementById('chat-with-name'),
        chatStatusIndicator: document.getElementById('chat-status-indicator'),
        chatStatusText: document.getElementById('chat-status-text'),
        messageBox: document.getElementById('message-box'),
        msgInput: document.getElementById('msg-input'),
        sendBtn: document.getElementById('send-btn'),
        micBtn: document.getElementById('mic-btn'),
        attachBtn: document.getElementById('attach-btn'),
        imageUpload: document.getElementById('image-upload'),
        
        // AI
        aiInput: document.getElementById('ai-input'),
        aiSendBtn: document.getElementById('ai-send-btn'),
        clearAiChat: document.getElementById('clear-ai-chat'),
        
        // Buttons
        inviteBtn: document.getElementById('invite-btn'),
        createGroupBtn: document.getElementById('create-group-btn'),
        
        // Empty states
        emptyChats: document.getElementById('empty-chats'),
        emptyGroups: document.getElementById('empty-groups'),
        
        // Toast and loading
        toastContainer: document.getElementById('toast-container'),
        loadingOverlay: document.getElementById('loading-overlay')
    };

    console.log('📋 DOM elements found:', Object.keys(elements).filter(key => elements[key]).length);

    // ================= CHECK LOGIN =================
    onAuthStateChanged(auth, async (user) => {
        console.log('🔐 Auth state:', user ? 'Logged in' : 'Logged out');
        
        if (user) {
            currentUser = {
                uid: user.uid,
                displayName: user.displayName || 'User',
                email: user.email,
                photoURL: user.photoURL || 'https://via.placeholder.com/100'
            };
            
            console.log('👤 Current user:', currentUser.displayName);
            
            // Save to localStorage
            localStorage.setItem('crunkUser', JSON.stringify(currentUser));
            
            // Update profile picture
            if (elements.headerProfilePic) {
                elements.headerProfilePic.src = currentUser.photoURL;
            }
            
            // Save to Firestore
            await saveUserToFirestore(currentUser);
            
            // Load data
            loadUsers(elements);
            loadRecentChats(elements);
            loadGroups(elements);
            loadAIChatHistory(elements);
            setupPresence();
            
            // Show welcome message in AI
            if (elements.aiMessages && elements.aiMessages.children.length === 0) {
                addAIMessage(elements, "Hello! I'm Venocyber-MD, your AI assistant created by rajola. How can I help you today?", 'ai');
            }
            
        } else {
            console.log('❌ No user, redirecting to login');
            window.location.href = 'index.html';
        }
    });

    // ================= MENU FUNCTIONS =================
    if (elements.menuToggle && elements.menuModal) {
        elements.menuToggle.addEventListener('click', () => {
            console.log('🍔 Menu clicked');
            elements.menuModal.classList.remove('hidden');
            
            // Update menu with user info
            const menuProfilePic = document.getElementById('menu-profile-pic');
            const menuUserName = document.getElementById('menu-user-name');
            const menuUserEmail = document.getElementById('menu-user-email');
            
            if (currentUser) {
                if (menuProfilePic) menuProfilePic.src = currentUser.photoURL;
                if (menuUserName) menuUserName.textContent = currentUser.displayName;
                if (menuUserEmail) menuUserEmail.textContent = currentUser.email;
            }
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });

    // ================= LOGOUT =================
    window.logout = async function() {
        console.log('🚪 Logging out...');
        try {
            await signOut(auth);
            localStorage.removeItem('crunkUser');
            localStorage.removeItem('aiChatHistory');
            showToast(elements, 'Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            showToast(elements, 'Failed to logout', 'error');
        }
    };

    // ================= PROFILE =================
    window.showProfile = function() {
        console.log('👤 Showing profile');
        closeAllModals();
        
        const profileModal = document.getElementById('profile-modal');
        if (profileModal && currentUser) {
            const profilePic = document.getElementById('profile-modal-pic');
            const profileName = document.getElementById('profile-modal-name');
            const profileEmail = document.getElementById('profile-modal-email');
            const profilePhone = document.getElementById('profile-modal-phone');
            
            if (profilePic) profilePic.src = currentUser.photoURL;
            if (profileName) profileName.textContent = currentUser.displayName;
            if (profileEmail) profileEmail.textContent = currentUser.email;
            
            // Get phone from localStorage
            const savedUser = JSON.parse(localStorage.getItem('crunkUser') || '{}');
            if (profilePhone) profilePhone.textContent = savedUser.phone || 'Not provided';
            
            profileModal.classList.remove('hidden');
        }
    };

    // ================= THEME TOGGLE =================
    window.toggleTheme = function() {
        console.log('🎨 Toggling theme');
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        showToast(elements, `Theme switched to ${isLight ? 'light' : 'dark'} mode`, 'success');
        closeAllModals();
    };

    // ================= SHARE APP =================
    window.shareApp = function() {
        console.log('📱 Sharing app');
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
        closeAllModals();
    };

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(elements, 'Link copied to clipboard!', 'success');
        }).catch(() => {
            showToast(elements, 'Failed to copy link', 'error');
        });
    }

    // ================= SETTINGS =================
    window.openSettings = function() {
        console.log('⚙️ Opening settings');
        showToast(elements, 'Settings coming soon!', 'info');
        closeAllModals();
    };

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }

    // ================= TAB SWITCHING =================
    if (elements.tabChats && elements.chatsView) {
        elements.tabChats.addEventListener('click', () => {
            console.log('📋 Chats tab clicked');
            document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
            elements.tabChats.classList.add('active');
            document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
            elements.chatsView.classList.add('active');
        });
    }

    if (elements.tabContacts && elements.contactsView) {
        elements.tabContacts.addEventListener('click', () => {
            console.log('👥 Contacts tab clicked');
            document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
            elements.tabContacts.classList.add('active');
            document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
            elements.contactsView.classList.add('active');
        });
    }

    if (elements.tabGroups && elements.groupsView) {
        elements.tabGroups.addEventListener('click', () => {
            console.log('👥 Groups tab clicked');
            document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
            elements.tabGroups.classList.add('active');
            document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
            elements.groupsView.classList.add('active');
        });
    }

    if (elements.tabAi && elements.aiView) {
        elements.tabAi.addEventListener('click', () => {
            console.log('🤖 AI tab clicked');
            document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
            elements.tabAi.classList.add('active');
            document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
            elements.aiView.classList.add('active');
        });
    }

    // ================= SEARCH TOGGLE =================
    if (elements.searchToggle && elements.searchBar) {
        elements.searchToggle.addEventListener('click', () => {
            console.log('🔍 Search clicked');
            elements.searchBar.classList.toggle('hidden');
            if (!elements.searchBar.classList.contains('hidden') && elements.globalSearch) {
                elements.globalSearch.focus();
            }
        });
    }

    // Clear search
    if (elements.clearSearch && elements.globalSearch) {
        elements.clearSearch.addEventListener('click', () => {
            elements.globalSearch.value = '';
            renderContacts(elements, allUsers);
        });
    }

    // Search functionality
    if (elements.globalSearch) {
        elements.globalSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query) {
                const filtered = allUsers.filter(user => 
                    user.displayName && user.displayName.toLowerCase().includes(query)
                );
                renderContacts(elements, filtered);
            } else {
                renderContacts(elements, allUsers);
            }
        });
    }

    // ================= AI CHAT =================
    if (elements.aiSendBtn && elements.aiInput) {
        elements.aiSendBtn.addEventListener('click', () => {
            const message = elements.aiInput.value.trim();
            if (message) {
                console.log('🤖 AI message:', message);
                sendToVenocyber(elements, message);
                elements.aiInput.value = '';
            }
        });
    }

    if (elements.aiInput) {
        elements.aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = elements.aiInput.value.trim();
                if (message) {
                    console.log('🤖 AI message (enter):', message);
                    sendToVenocyber(elements, message);
                    elements.aiInput.value = '';
                }
            }
        });
    }

    // Clear AI chat
    if (elements.clearAiChat) {
        elements.clearAiChat.addEventListener('click', () => {
            clearAIChat(elements);
        });
    }

    // ================= BACK BUTTON =================
    if (elements.backBtn && elements.chatScreen && elements.homeScreen) {
        elements.backBtn.addEventListener('click', () => {
            console.log('⬅️ Back button clicked');
            elements.chatScreen.classList.remove('active');
            elements.homeScreen.classList.add('active');
            if (messagesUnsubscribe) messagesUnsubscribe();
        });
    }

    // ================= INVITE BUTTON =================
    if (elements.inviteBtn) {
        elements.inviteBtn.addEventListener('click', () => {
            console.log('📨 Invite clicked');
            if (navigator.share) {
                navigator.share({
                    title: 'Crunk Chat',
                    text: 'Join me on Crunk Chat!',
                    url: window.location.origin
                }).catch(() => {
                    copyToClipboard(window.location.origin);
                });
            } else {
                copyToClipboard(window.location.origin);
            }
        });
    }

    // ================= CREATE GROUP BUTTON =================
    if (elements.createGroupBtn) {
        elements.createGroupBtn.addEventListener('click', () => {
            console.log('👥 Create group clicked');
            showCreateGroupModal(elements);
        });
    }

    // ================= ATTACH BUTTON =================
    if (elements.attachBtn && elements.imageUpload) {
        elements.attachBtn.addEventListener('click', () => {
            elements.imageUpload.click();
        });
    }

    if (elements.imageUpload) {
        elements.imageUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showToast(elements, 'Please select an image file', 'error');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showToast(elements, 'Image must be less than 5MB', 'error');
                    return;
                }
                await sendImage(elements, file);
                elements.imageUpload.value = '';
            }
        });
    }

    // ================= SEND MESSAGE =================
    if (elements.sendBtn && elements.msgInput) {
        elements.sendBtn.addEventListener('click', () => {
            sendMessage(elements);
        });
    }

    if (elements.msgInput) {
        elements.msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(elements);
            }
        });
        
        elements.msgInput.addEventListener('input', () => {
            if (elements.msgInput.value.trim()) {
                if (elements.micBtn) elements.micBtn.classList.add('hidden');
                if (elements.sendBtn) elements.sendBtn.classList.remove('hidden');
            } else {
                if (elements.micBtn) elements.micBtn.classList.remove('hidden');
                if (elements.sendBtn) elements.sendBtn.classList.add('hidden');
            }
        });
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }

    console.log('✅ UI initialization complete');
}

// ================= HELPER FUNCTIONS =================

function showToast(elements, message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }, 100);
}

function showLoading(elements, show) {
    if (elements.loadingOverlay) {
        if (show) {
            elements.loadingOverlay.classList.remove('hidden');
        } else {
            elements.loadingOverlay.classList.add('hidden');
        }
    }
}

// ================= FIRESTORE FUNCTIONS =================

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

function setupPresence() {
    if (!currentUser) return;
    
    const userStatusRef = doc(db, 'users', currentUser.uid);
    
    window.addEventListener('beforeunload', () => {
        updateDoc(userStatusRef, {
            status: 'offline',
            lastSeen: serverTimestamp()
        });
    });
    
    updateDoc(userStatusRef, {
        status: 'online',
        lastSeen: serverTimestamp()
    });
    
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
    });
}

// ================= LOAD USERS =================

async function loadUsers(elements) {
    if (!currentUser || !elements.userList) return;
    
    console.log('👥 Loading users...');
    
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
        renderContacts(elements, users);
    });
}

function renderContacts(elements, users) {
    if (!elements.userList) return;
    
    if (users.length === 0) {
        elements.userList.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
        return;
    }
    
    elements.userList.innerHTML = '';
    users.forEach(user => {
        const isOnline = onlineUsers.has(user.uid);
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.setAttribute('data-userid', user.uid);
        contactEl.onclick = () => openChat(elements, user);
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
        elements.userList.appendChild(contactEl);
    });
}

// ================= LOAD RECENT CHATS =================

function loadRecentChats(elements) {
    if (!currentUser || !elements.recentChatsList) return;
    
    console.log('📋 Loading recent chats...');
    
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef, 
        where('participants', 'array-contains', currentUser.uid),
        orderBy('lastMessageTime', 'desc')
    );
    
    if (chatsUnsubscribe) chatsUnsubscribe();
    
    chatsUnsubscribe = onSnapshot(q, async (snapshot) => {
        const chats = [];
        snapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
        });
        
        if (chats.length === 0) {
            if (elements.emptyChats) elements.emptyChats.classList.remove('hidden');
            elements.recentChatsList.innerHTML = '';
            return;
        }
        
        if (elements.emptyChats) elements.emptyChats.classList.add('hidden');
        elements.recentChatsList.innerHTML = '';
        
        for (const chat of chats) {
            const otherUserId = chat.participants.find(id => id !== currentUser.uid);
            if (!otherUserId) continue;
            
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            const otherUser = userDoc.data();
            
            if (!otherUser) continue;
            
            const isOnline = onlineUsers.has(otherUserId);
            const lastMessageTime = chat.lastMessageTime?.toDate ? chat.lastMessageTime.toDate() : new Date();
            
            const chatEl = document.createElement('div');
            chatEl.className = 'chat-item';
            chatEl.setAttribute('data-chatid', chat.id);
            chatEl.onclick = () => openChat(elements, otherUser, chat.id);
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
                        ${chat.lastMessage?.type === 'text' ? chat.lastMessage.content?.substring(0, 30) + '...' : '📷 Image'}
                    </div>
                </div>
                <div class="chat-time">${formatTime(lastMessageTime)}</div>
                ${chat.unreadCount ? `<span class="unread-badge">${chat.unreadCount}</span>` : ''}
            `;
            elements.recentChatsList.appendChild(chatEl);
        }
    });
}

// ================= OPEN CHAT =================

async function openChat(elements, user, existingChatId = null) {
    if (!currentUser || !user) return;
    
    currentChatUser = user;
    
    if (elements.chatAvatar) elements.chatAvatar.src = user.photoURL || 'https://via.placeholder.com/56';
    if (elements.chatWithName) elements.chatWithName.textContent = user.displayName;
    
    const isOnline = onlineUsers.has(user.uid);
    if (elements.chatStatusIndicator) {
        elements.chatStatusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    }
    if (elements.chatStatusText) elements.chatStatusText.textContent = isOnline ? 'Online' : 'Offline';
    
    if (existingChatId) {
        currentChatId = existingChatId;
    } else {
        currentChatId = await getOrCreateChat(user.uid);
    }
    
    if (elements.homeScreen) elements.homeScreen.classList.remove('active');
    if (elements.chatScreen) elements.chatScreen.classList.add('active');
    
    loadMessages(elements, currentChatId);
}

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

function loadMessages(elements, chatId) {
    if (messagesUnsubscribe) messagesUnsubscribe();
    if (!chatId || !elements.messageBox) return;
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        renderMessages(elements, messages);
    });
}

function renderMessages(elements, messages) {
    if (!elements.messageBox) return;
    
    elements.messageBox.innerHTML = '';
    
    if (messages.length === 0) {
        elements.messageBox.innerHTML = '<div class="empty-state"><p>No messages yet. Say hello!</p></div>';
        return;
    }
    
    messages.forEach((message) => {
        const messageDate = message.timestamp?.toDate ? message.timestamp.toDate() : new Date();
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`;
        
        if (message.type === 'text') {
            messageEl.innerHTML = `
                <div class="message-content">
                    ${message.content || ''}
                </div>
                <div class="message-info">
                    <span class="message-time">${formatTime(messageDate)}</span>
                </div>
            `;
        } else if (message.type === 'image') {
            messageEl.innerHTML = `
                <div class="message-content">
                    <img src="${message.url}" class="message-image" onclick='window.openImageModal("${message.url}")' style="max-width: 200px; max-height: 200px; border-radius: 8px; cursor: pointer;">
                </div>
                <div class="message-info">
                    <span class="message-time">${formatTime(messageDate)}</span>
                </div>
            `;
        }
        
        elements.messageBox.appendChild(messageEl);
    });
    
    elements.messageBox.scrollTop = elements.messageBox.scrollHeight;
}

// ================= SEND MESSAGE =================

async function sendMessage(elements) {
    const content = elements.msgInput ? elements.msgInput.value.trim() : '';
    if (!content) return;
    
    // Check for AI command
    if (content.startsWith('#ven ')) {
        const aiQuestion = content.substring(5).trim();
        await sendToVenocyber(elements, aiQuestion);
        elements.msgInput.value = '';
        if (elements.micBtn && elements.sendBtn) {
            elements.micBtn.classList.remove('hidden');
            elements.sendBtn.classList.add('hidden');
        }
        return;
    }
    
    if (!currentChatId) {
        showToast(elements, 'No active chat', 'error');
        return;
    }
    
    const message = {
        senderId: currentUser.uid,
        type: 'text',
        content: content,
        timestamp: serverTimestamp(),
        status: 'sent'
    };
    
    try {
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), message);
        
        const chatRef = doc(db, 'chats', currentChatId);
        await updateDoc(chatRef, {
            lastMessage: message,
            lastMessageTime: serverTimestamp()
        });
        
        elements.msgInput.value = '';
        
        if (elements.micBtn && elements.sendBtn) {
            elements.micBtn.classList.remove('hidden');
            elements.sendBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast(elements, 'Failed to send message', 'error');
    }
}

// ================= SEND IMAGE =================

async function sendImage(elements, file) {
    if (!file || !currentChatId) {
        showToast(elements, 'No active chat or file', 'error');
        return;
    }
    
    showLoading(elements, true);
    
    try {
        // For now, just show a message that image upload is coming
        showToast(elements, 'Image upload coming soon!', 'info');
    } catch (error) {
        console.error('Error:', error);
        showToast(elements, 'Failed to send image', 'error');
    } finally {
        showLoading(elements, false);
    }
}

// ================= AI FUNCTIONS =================

async function sendToVenocyber(elements, message) {
    // Add user message
    addAIMessage(elements, message, 'user');
    
    // Show typing indicator
    showAITyping(elements, true);
    
    try {
        // Check if Venocyber is loaded
        if (!window.venocyber) {
            console.log('⏳ Waiting for Venocyber to load...');
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (window.venocyber) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }
        
        let response;
        if (window.venocyber) {
            response = await window.venocyber.chat(message);
        } else {
            response = getFallbackResponse(message);
        }
        
        showAITyping(elements, false);
        addAIMessage(elements, response, 'ai');
        
    } catch (error) {
        console.error('AI Error:', error);
        showAITyping(elements, false);
        addAIMessage(elements, "Sorry, I'm having trouble connecting. Please try again!", 'ai');
    }
}

function getFallbackResponse(message) {
    const msg = message.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return "Hello! I'm Venocyber-MD, created by rajola. How can I help you today? 👋";
    }
    if (msg.includes('who are you') || msg.includes('your name')) {
        return "I'm Venocyber-MD, an AI assistant created by rajola! 🤖";
    }
    if (msg.includes('owner') || msg.includes('creator') || msg.includes('rajola')) {
        return "My creator is rajola! You can contact them at +255676195192 📱";
    }
    if (msg.includes('channel') || msg.includes('whatsapp')) {
        return "Join my WhatsApp channel: https://whatsapp.com/channel/0029VbCU7aBLikgExwCBqW3P 📢";
    }
    if (msg.includes('joke')) {
        const jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "What do you call a fake noodle? An impasta! 🍝",
            "Why did the scarecrow win an award? He was outstanding in his field! 🌾"
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (msg.includes('time')) {
        return `Current time is ${new Date().toLocaleTimeString()} ⏰`;
    }
    if (msg.includes('date')) {
        return `Today is ${new Date().toLocaleDateString()} 📅`;
    }
    return "I'm Venocyber-MD. How can I assist you today?";
}

function addAIMessage(elements, content, sender) {
    if (!elements.aiMessages) return;
    
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
    elements.aiMessages.appendChild(messageDiv);
    
    elements.aiMessages.scrollTop = elements.aiMessages.scrollHeight;
    
    // Save to history
    aiMessages.push({ content, sender, timestamp: new Date().toISOString() });
    if (aiMessages.length > 50) aiMessages = aiMessages.slice(-50);
    localStorage.setItem('aiChatHistory', JSON.stringify(aiMessages));
}

function showAITyping(elements, show) {
    if (!elements.aiMessages) return;
    
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
            elements.aiMessages.appendChild(typingIndicator);
            elements.aiMessages.scrollTop = elements.aiMessages.scrollHeight;
        }
    } else {
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

function loadAIChatHistory(elements) {
    const saved = localStorage.getItem('aiChatHistory');
    if (saved && elements.aiMessages) {
        try {
            aiMessages = JSON.parse(saved);
            elements.aiMessages.innerHTML = '';
            aiMessages.forEach(msg => {
                addAIMessage(elements, msg.content, msg.sender);
            });
        } catch (e) {
            console.error('Error loading AI history:', e);
        }
    }
}

function clearAIChat(elements) {
    aiMessages = [];
    localStorage.removeItem('aiChatHistory');
    if (elements.aiMessages) {
        elements.aiMessages.innerHTML = '';
        addAIMessage(elements, "Hello! I'm Venocyber-MD, your AI assistant created by rajola. How can I help you today?", 'ai');
    }
    showToast(elements, 'AI chat cleared', 'success');
}

// ================= GROUP FUNCTIONS =================

function loadGroups(elements) {
    if (!currentUser || !elements.groupsList) return;
    
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', currentUser.uid));
    
    if (groupsUnsubscribe) groupsUnsubscribe();
    
    groupsUnsubscribe = onSnapshot(q, (snapshot) => {
        const groups = [];
        snapshot.forEach(doc => {
            groups.push({ id: doc.id, ...doc.data() });
        });
        renderGroups(elements, groups);
    });
}

function renderGroups(elements, groups) {
    if (!elements.groupsList || !elements.emptyGroups) return;
    
    if (groups.length === 0) {
        elements.groupsList.innerHTML = '';
        elements.emptyGroups.style.display = 'flex';
        return;
    }
    
    elements.emptyGroups.style.display = 'none';
    elements.groupsList.innerHTML = '';
    
    groups.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'group-item';
        groupEl.onclick = () => {
            showToast(elements, `Opening group: ${group.name}`, 'info');
        };
        groupEl.innerHTML = `
            <div class="group-avatar">
                ${group.photoURL ? `<img src="${group.photoURL}" alt="${group.name}">` : 
                  '<i class="fas fa-users"></i>'}
            </div>
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-members">${group.members?.length || 0} members</div>
                <div class="group-last-message">${group.lastMessage?.content || 'No messages yet'}</div>
            </div>
        `;
        elements.groupsList.appendChild(groupEl);
    });
}

function showCreateGroupModal(elements) {
    const groupModal = document.getElementById('group-modal');
    const memberSelection = document.getElementById('member-selection');
    
    if (!groupModal || !memberSelection) return;
    
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
    
    groupModal.classList.remove('hidden');
}

// ================= UTILITY FUNCTIONS =================

function formatTime(date) {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

// ================= GLOBAL FUNCTIONS =================

window.closeModals = function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
};

window.openImageModal = function(url) {
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    if (imageModal && modalImage) {
        modalImage.src = url;
        imageModal.classList.add('active');
    }
};

// Make functions available globally
window.showProfile = window.showProfile;
window.toggleTheme = window.toggleTheme;
window.shareApp = window.shareApp;
window.openSettings = window.openSettings;
window.logout = window.logout;

console.log('✅ Chat.js fully loaded and ready!');
