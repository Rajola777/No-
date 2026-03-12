import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, updateDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// Import Storage for Images and Voice Notes
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWW5kT1GqpIGou84aOfmo3y0osUd7rRQ",
  authDomain: "zchat-7b59a.firebaseapp.com",
  projectId: "zchat-7b59a",
  storageBucket: "zchat-7b59a.firebasestorage.app",
  messagingSenderId: "391204652656",
  appId: "1:391204652656:web:7c88d2bfb7ca2261ecd6b5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const homeScreen = document.getElementById("home-screen");
const chatScreen = document.getElementById("chat-screen");
const chatsView = document.getElementById("chats-view");
const contactsView = document.getElementById("contacts-view");
const recentChatsList = document.getElementById("recent-chats-list");
const userList = document.getElementById("user-list");
const msgBox = document.getElementById("message-box");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const imageUpload = document.getElementById("image-upload");
const emptyChats = document.getElementById("empty-chats");

let currentChatUser = null;
let typingTimeout;

// --- LOGIN & STATUS ---
async function loginAnonymously() {
  try {
    const cred = await signInAnonymously(auth);
    await setDoc(doc(db, "users", cred.user.uid), {
      name: `User_${cred.user.uid.substring(0,4)}`,
      photo: `https://i.pravatar.cc/150?u=${cred.user.uid}`,
      online: true,
      typingTo: null 
    }, { merge: true });
    loadRecentChats();
  } catch(err) { console.error("Login failed:", err); }
}
loginAnonymously();

// --- TAB NAVIGATION ---
window.switchTab = function(tab) {
  if (tab === 'chats') {
    chatsView.classList.remove('hidden');
    contactsView.classList.add('hidden');
    document.getElementById('tab-chats').classList.add('active');
    document.getElementById('tab-contacts').classList.remove('active');
    loadRecentChats();
  } else {
    chatsView.classList.add('hidden');
    contactsView.classList.remove('hidden');
    document.getElementById('tab-chats').classList.remove('active');
    document.getElementById('tab-contacts').classList.add('active');
    loadContacts();
  }
}
document.getElementById("tab-chats").addEventListener("click", () => switchTab('chats'));
document.getElementById("tab-contacts").addEventListener("click", () => switchTab('contacts'));

// --- LOAD CONTACTS ---
function loadContacts() {
  onSnapshot(collection(db, "users"), snapshot => {
    userList.innerHTML = "";
    snapshot.forEach(docSnap => {
      const user = docSnap.data();
      if (docSnap.id === auth.currentUser.uid) return;
      userList.innerHTML += `
        <div class="user-card" onclick="startChat('${docSnap.id}','${user.name}','${user.photo}')">
          <img src="${user.photo}" class="profile-pic">
          <div class="user-info">
            <h3>${user.name}</h3><p>${user.online ? "🟢 Online" : "🔴 Offline"}</p>
          </div>
        </div>`;
    });
  });
}

// --- LOAD RECENT CHATS ---
function loadRecentChats() {
    // Note: For a real app, you'd want a separate "chats" collection. 
    // This queries all contacts for now to act as recent chats to fit your current schema.
    onSnapshot(collection(db, "users"), snapshot => {
        recentChatsList.innerHTML = "";
        let hasChats = false; // Add logic here later to filter users you actually have messages with

        snapshot.forEach(docSnap => {
            if (docSnap.id !== auth.currentUser.uid) {
                hasChats = true;
                const user = docSnap.data();
                recentChatsList.innerHTML += `
                <div class="user-card" onclick="startChat('${docSnap.id}','${user.name}','${user.photo}')">
                    <img src="${user.photo}" class="profile-pic">
                    <div class="user-info">
                    <h3>${user.name}</h3><p>Tap to view chat...</p>
                    </div>
                </div>`;
            }
        });

        if (!hasChats) {
            emptyChats.classList.remove("hidden");
            recentChatsList.classList.add("hidden");
        } else {
            emptyChats.classList.add("hidden");
            recentChatsList.classList.remove("hidden");
        }
    });
}

// --- START CHAT ---
window.startChat = function(uid, name, img) {
  currentChatUser = uid;
  homeScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
  document.getElementById("chat-with-name").innerText = name;
  document.getElementById("chat-avatar").src = img;

  // Listen to recipient's typing/online status
  onSnapshot(doc(db, "users", uid), docSnap => {
      const user = docSnap.data();
      const statusText = document.getElementById("chat-status");
      if (user.typingTo === auth.currentUser.uid) {
          statusText.innerText = "Typing...";
          statusText.style.color = "#25D366";
      } else {
          statusText.innerText = user.online ? "Online" : "Offline";
          statusText.style.color = "gray";
      }
  });

  loadMessages(uid);
}

function getChatId(uid) {
  return auth.currentUser.uid < uid ? `${auth.currentUser.uid}_${uid}` : `${uid}_${auth.currentUser.uid}`;
}

function loadMessages(uid) {
  const q = query(collection(db, "messages"), where("chatId", "==", getChatId(uid)), orderBy("time", "asc"));
  onSnapshot(q, snapshot => {
    msgBox.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.className = msg.sender === auth.currentUser.uid ? "msg sent" : "msg received";
      
      if(msg.type === "image") {
          div.innerHTML = `<img src="${msg.fileUrl}" style="max-width: 200px; border-radius: 8px;">`;
      } else if (msg.type === "audio") {
          div.innerHTML = `<audio controls src="${msg.fileUrl}" style="max-width: 200px;"></audio>`;
      } else {
          div.innerText = msg.text;
      }
      msgBox.appendChild(div);
    });
    msgBox.scrollTop = msgBox.scrollHeight;
  });
}

// --- SENDING MESSAGES & MEDIA ---
async function sendMessage(text = "", type = "text", fileUrl = null) {
  if (!currentChatUser) return;
  await addDoc(collection(db, "messages"), {
    chatId: getChatId(currentChatUser),
    sender: auth.currentUser.uid,
    text: text,
    type: type,
    fileUrl: fileUrl,
    time: serverTimestamp()
  });
  msgInput.value = "";
  sendBtn.classList.add("hidden");
  micBtn.classList.remove("hidden");
  updateDoc(doc(db, "users", auth.currentUser.uid), { typingTo: null });
}

sendBtn.addEventListener("click", () => sendMessage(msgInput.value));

// Upload Image
imageUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const uploadTask = await uploadBytesResumable(storageRef, file);
    const url = await getDownloadURL(uploadTask.ref);
    sendMessage("", "image", url);
});

// Typing Indicator Logic & Mic/Send Button Toggle
msgInput.addEventListener("input", () => {
    if (msgInput.value.trim().length > 0) {
        sendBtn.classList.remove("hidden");
        micBtn.classList.add("hidden");
        updateDoc(doc(db, "users", auth.currentUser.uid), { typingTo: currentChatUser });
    } else {
        sendBtn.classList.add("hidden");
        micBtn.classList.remove("hidden");
        updateDoc(doc(db, "users", auth.currentUser.uid), { typingTo: null });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        updateDoc(doc(db, "users", auth.currentUser.uid), { typingTo: null });
    }, 2000);
});

// --- INVITE FRIENDS ---
document.getElementById("invite-btn").addEventListener("click", () => {
    if (navigator.share) {
        navigator.share({
            title: 'Join me on ZChat',
            text: 'Hey! Chat with me on ZChat, an awesome new app.',
            url: window.location.href, // Sends the link to your website
        }).catch(console.error);
    } else {
        alert("Copy this link to invite friends: " + window.location.href);
    }
});

// Back Button
document.getElementById("back-btn").addEventListener("click", () => {
  chatScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
  currentChatUser = null;
  updateDoc(doc(db, "users", auth.currentUser.uid), { typingTo: null });
});

// Manage Online Status
onAuthStateChanged(auth, async (user) => {
  if (user) await updateDoc(doc(db, "users", user.uid), { online: true });
});
window.addEventListener("beforeunload", async () => {
  if (auth.currentUser) await updateDoc(doc(db, "users", auth.currentUser.uid), { online: false, typingTo: null });
});
// --- VOICE NOTES (MediaRecorder API) ---
let mediaRecorder;
let audioChunks = [];

// Ask for microphone permissions and set up the recorder
async function setupVoiceRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            // Collect audio data as it records
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };

            // When recording stops, package it and send it to Firebase
            mediaRecorder.onstop = async () => {
                // Change mic icon to a loading spinner while uploading
                micBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                micBtn.style.color = "gray";

                // Create the audio file (Blob)
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = []; // Clear chunks for the next recording

                // Upload to Firebase Storage
                const storageRef = ref(storage, `voice_notes/${Date.now()}_audio.webm`);
                const uploadTask = await uploadBytesResumable(storageRef, audioBlob);
                const fileUrl = await getDownloadURL(uploadTask.ref);

                // Send as an audio message using our existing function
                await sendMessage("", "audio", fileUrl);

                // Reset mic icon back to normal
                micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                micBtn.style.color = ""; 
            };
        } catch (err) {
            console.error("Microphone access denied:", err);
            // Don't alert immediately, just log it. The user might not want to grant mic access right away.
        }
    } else {
        console.warn("Audio recording is not supported in this browser.");
    }
}

// Initialize the setup
setupVoiceRecording();

// --- PUSH TO TALK CONTROLS ---
function startRecording(e) {
    e.preventDefault(); // Prevents screen zooming or context menus on mobile
    if (mediaRecorder && mediaRecorder.state === "inactive") {
        audioChunks = [];
        mediaRecorder.start();
        micBtn.style.color = "red"; // Turn mic red to show it's recording
        micBtn.style.transform = "scale(1.2)"; // Make it pop a bit
    } else if (!mediaRecorder) {
        alert("Please allow microphone permissions to send voice notes.");
        setupVoiceRecording(); // Try asking for permissions again
    }
}

function stopRecording(e) {
    e.preventDefault();
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        micBtn.style.transform = "scale(1)"; // Reset size
    }
}

// Mouse events (for desktop testing)
micBtn.addEventListener("mousedown", startRecording);
micBtn.addEventListener("mouseup", stopRecording);
micBtn.addEventListener("mouseleave", stopRecording); // If they drag mouse off button

// Touch events (for mobile devices)
micBtn.addEventListener("touchstart", startRecording, { passive: false });
micBtn.addEventListener("touchend", stopRecording);
micBtn.addEventListener("touchcancel", stopRecording);
