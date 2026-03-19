// ==================== SESSION CHECK ====================
(function checkExistingSession() {
    const savedUser = localStorage.getItem("crunkUser");
    if (savedUser) {
        console.log("✅ User already logged in, redirecting to home...");
        window.location.replace("home.html");
    }
})();

// ==================== FIREBASE SETUP ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    collection,
    query,
    where,
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Firebase Configuration
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
console.log("🚀 Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

console.log("✅ Firebase initialized successfully");

// ==================== COUNTRY CODES API ====================
async function fetchCountryCodes() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
        const countries = await response.json();
        
        return countries
            .filter(country => country.idd?.root && country.idd?.suffixes?.[0])
            .map(country => {
                const root = country.idd.root;
                const suffix = country.idd.suffixes[0];
                const code = root + suffix;
                
                return {
                    code: code,
                    country: country.name.common,
                    flag: country.flags?.png || '',
                    cca2: country.cca2.toLowerCase()
                };
            })
            .sort((a, b) => a.country.localeCompare(b.country));
    } catch (error) {
        console.error('Error fetching countries:', error);
        return getFallbackCountries();
    }
}

function getFallbackCountries() {
    return [
        { code: "+1", country: "United States", flag: "🇺🇸" },
        { code: "+1", country: "Canada", flag: "🇨🇦" },
        { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
        { code: "+61", country: "Australia", flag: "🇦🇺" },
        { code: "+91", country: "India", flag: "🇮🇳" },
        { code: "+86", country: "China", flag: "🇨🇳" },
        { code: "+81", country: "Japan", flag: "🇯🇵" },
        { code: "+82", country: "South Korea", flag: "🇰🇷" },
        { code: "+49", country: "Germany", flag: "🇩🇪" },
        { code: "+33", country: "France", flag: "🇫🇷" },
        { code: "+39", country: "Italy", flag: "🇮🇹" },
        { code: "+34", country: "Spain", flag: "🇪🇸" },
        { code: "+7", country: "Russia", flag: "🇷🇺" },
        { code: "+55", country: "Brazil", flag: "🇧🇷" },
        { code: "+52", country: "Mexico", flag: "🇲🇽" },
        { code: "+27", country: "South Africa", flag: "🇿🇦" },
        { code: "+234", country: "Nigeria", flag: "🇳🇬" },
        { code: "+20", country: "Egypt", flag: "🇪🇬" },
        { code: "+971", country: "UAE", flag: "🇦🇪" },
        { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
        { code: "+972", country: "Israel", flag: "🇮🇱" },
        { code: "+90", country: "Turkey", flag: "🇹🇷" },
        { code: "+31", country: "Netherlands", flag: "🇳🇱" },
        { code: "+32", country: "Belgium", flag: "🇧🇪" },
        { code: "+41", country: "Switzerland", flag: "🇨🇭" },
        { code: "+46", country: "Sweden", flag: "🇸🇪" },
        { code: "+47", country: "Norway", flag: "🇳🇴" },
        { code: "+45", country: "Denmark", flag: "🇩🇰" },
        { code: "+358", country: "Finland", flag: "🇫🇮" },
        { code: "+48", country: "Poland", flag: "🇵🇱" },
        { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
        { code: "+36", country: "Hungary", flag: "🇭🇺" },
        { code: "+30", country: "Greece", flag: "🇬🇷" },
        { code: "+351", country: "Portugal", flag: "🇵🇹" },
        { code: "+353", country: "Ireland", flag: "🇮🇪" },
        { code: "+64", country: "New Zealand", flag: "🇳🇿" },
        { code: "+65", country: "Singapore", flag: "🇸🇬" },
        { code: "+60", country: "Malaysia", flag: "🇲🇾" },
        { code: "+66", country: "Thailand", flag: "🇹🇭" },
        { code: "+63", country: "Philippines", flag: "🇵🇭" },
        { code: "+84", country: "Vietnam", flag: "🇻🇳" },
        { code: "+62", country: "Indonesia", flag: "🇮🇩" },
        { code: "+92", country: "Pakistan", flag: "🇵🇰" },
        { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
        { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
        { code: "+977", country: "Nepal", flag: "🇳🇵" },
        { code: "+98", country: "Iran", flag: "🇮🇷" },
        { code: "+964", country: "Iraq", flag: "🇮🇶" },
        { code: "+963", country: "Syria", flag: "🇸🇾" },
        { code: "+961", country: "Lebanon", flag: "🇱🇧" },
        { code: "+962", country: "Jordan", flag: "🇯🇴" },
        { code: "+255", country: "Tanzania", flag: "🇹🇿" },
        { code: "+254", country: "Kenya", flag: "🇰🇪" },
        { code: "+256", country: "Uganda", flag: "🇺🇬" },
        { code: "+250", country: "Rwanda", flag: "🇷🇼" },
        { code: "+251", country: "Ethiopia", flag: "🇪🇹" }
    ];
}

// ==================== POPULATE COUNTRY CODES ====================
async function populateCountryCodes() {
    const countrySelect = document.getElementById('countryCode');
    if (!countrySelect) return;

    try {
        const countries = await fetchCountryCodes();
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.country} (${country.code})`;
            if (country.flag) {
                // You can add flag emoji if available
            }
            countrySelect.appendChild(option);
        });
        
        console.log(`✅ Loaded ${countries.length} countries`);
    } catch (error) {
        console.error('Error loading countries:', error);
        
        // Load fallback countries
        const fallbackCountries = getFallbackCountries();
        fallbackCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag || '🌍'} ${country.country} (${country.code})`;
            countrySelect.appendChild(option);
        });
    }
}

// ==================== UI HELPER FUNCTIONS ====================
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    // Auto hide success messages
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
}

function showLoader(show) {
    const loader = document.getElementById('loader');
    const submitBtn = document.getElementById('submitBtn');
    const googleBtn = document.getElementById('googleBtn');
    
    if (loader) loader.style.display = show ? 'flex' : 'none';
    
    if (submitBtn) {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        if (btnText) btnText.style.display = show ? 'none' : 'inline';
        if (btnLoader) btnLoader.style.display = show ? 'inline-block' : 'none';
    }
    
    if (googleBtn) {
        const googleText = googleBtn.querySelector('span');
        const googleLoader = googleBtn.querySelector('.google-loader');
        if (googleText) googleText.style.display = show ? 'none' : 'inline';
        if (googleLoader) googleLoader.style.display = show ? 'inline-block' : 'none';
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                     type === 'error' ? 'fas fa-exclamation-circle' : 
                     'fas fa-info-circle';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// ==================== FORM VALIDATION ====================
function validateUsername(username) {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return '';
}

function validateEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    return '';
}

function validatePhone(phone) {
    if (!/^\d+$/.test(phone)) return 'Phone number must contain only digits';
    if (phone.length < 7 || phone.length > 15) return 'Phone number must be 7-15 digits';
    return '';
}

// ==================== FORM SUBMISSION ====================
const form = document.getElementById('loginForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const countryCode = document.getElementById('countryCode')?.value;
        const phone = document.getElementById('phone')?.value.trim();
        
        // Validate inputs
        const usernameError = validateUsername(username);
        const emailError = validateEmail(email);
        const phoneError = validatePhone(phone);
        
        if (usernameError || emailError || phoneError) {
            if (usernameError) document.getElementById('usernameError').textContent = usernameError;
            if (emailError) document.getElementById('emailError').textContent = emailError;
            if (phoneError) document.getElementById('phoneError').textContent = phoneError;
            return;
        }
        
        const fullPhone = countryCode + phone;
        
        showLoader(true);
        
        try {
            // Check if user exists
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // Existing user - login
                const userData = querySnapshot.docs[0].data();
                localStorage.setItem("crunkUser", JSON.stringify({
                    uid: userData.uid,
                    username: userData.username,
                    displayName: userData.displayName || userData.username,
                    email: userData.email,
                    phone: userData.phone,
                    photoURL: userData.photoURL || null
                }));
                
                showMessage("Login successful! Redirecting...", "success");
                showToast("Welcome back!", "success");
                
                setTimeout(() => {
                    window.location.href = "home.html";
                }, 1000);
                return;
            }
            
            // New user - register
            const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const newUser = {
                uid: userId,
                username: username,
                displayName: username,
                email: email,
                phone: fullPhone,
                countryCode: countryCode,
                phoneNumber: phone,
                photoURL: null,
                loginMethod: 'form',
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'online',
                online: true
            };
            
            // Save to Firestore
            try {
                await setDoc(doc(db, "users", userId), newUser);
                console.log("✅ User saved to Firestore");
            } catch (e) {
                console.log("⚠️ Firestore error:", e);
            }
            
            // Save to localStorage
            localStorage.setItem("crunkUser", JSON.stringify({
                uid: userId,
                username: username,
                displayName: username,
                email: email,
                phone: fullPhone,
                photoURL: null
            }));
            
            showMessage("Registration successful! Redirecting...", "success");
            showToast("Welcome to Crunk Games!", "success");
            
            setTimeout(() => {
                window.location.href = "home.html";
            }, 1000);
            
        } catch (error) {
            console.error("❌ Error:", error);
            showMessage("An error occurred. Please try again.", "error");
            showToast("Login failed", "error");
        } finally {
            showLoader(false);
        }
    });
}

// ==================== GOOGLE LOGIN ====================
window.handleGoogleLogin = async function() {
    console.log("🚀 Starting Google login...");
    showLoader(true);
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log("✅ Google login successful:", result.user.email);
        
        const user = result.user;
        
        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData;
        
        if (userDoc.exists()) {
            console.log("👤 Existing user");
            const existingUser = userDoc.data();
            userData = {
                uid: user.uid,
                username: existingUser.username || user.displayName,
                displayName: existingUser.displayName || user.displayName,
                email: user.email,
                phone: existingUser.phone || '',
                photoURL: user.photoURL
            };
        } else {
            console.log("🆕 New Google user");
            userData = {
                uid: user.uid,
                username: user.displayName,
                displayName: user.displayName,
                email: user.email,
                phone: '',
                photoURL: user.photoURL,
                loginMethod: 'google',
                createdAt: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
                status: 'online',
                online: true
            };
            
            // Save to Firestore
            try {
                await setDoc(userDocRef, userData);
                console.log("✅ New user saved to Firestore");
            } catch (e) {
                console.log("⚠️ Firestore error:", e);
            }
        }
        
        // Save to localStorage
        localStorage.setItem("crunkUser", JSON.stringify(userData));
        console.log("💾 User saved to localStorage");
        
        showMessage("Login successful! Redirecting...", "success");
        showToast(`Welcome ${user.displayName}!`, "success");
        
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);
        
    } catch (error) {
        console.error("❌ Google login error:", error);
        
        let errorMessage = "Login failed. ";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Login cancelled. Please try again.";
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = "Popup was blocked. Please allow popups.";
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = `Please add ${window.location.hostname} to Firebase authorized domains.`;
        } else {
            errorMessage += error.message;
        }
        
        showMessage(errorMessage, "error");
        showToast("Google login failed", "error");
    } finally {
        showLoader(false);
    }
};

// ==================== HANDLE REDIRECT RESULT ====================
async function handleRedirectResult() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            console.log("🔄 Redirect result found");
            const user = result.user;
            
            const userData = {
                uid: user.uid,
                username: user.displayName,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            };
            
            localStorage.setItem("crunkUser", JSON.stringify(userData));
            window.location.href = "chats.html";
        }
    } catch (error) {
        console.error("Redirect result error:", error);
    }
}

// ==================== AUTH STATE CHANGE ====================
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("👤 Auth state: User is signed in:", user.email);
    } else {
        console.log("👤 Auth state: User is signed out");
    }
});

// ==================== REAL-TIME VALIDATION ====================
document.getElementById('username')?.addEventListener('input', (e) => {
    const error = validateUsername(e.target.value);
    document.getElementById('usernameError').textContent = error;
});

document.getElementById('email')?.addEventListener('input', (e) => {
    const error = validateEmail(e.target.value);
    document.getElementById('emailError').textContent = error;
});

document.getElementById('phone')?.addEventListener('input', (e) => {
    const error = validatePhone(e.target.value);
    document.getElementById('phoneError').textContent = error;
});

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("📱 Page loaded, initializing...");
    
    // Populate country codes
    await populateCountryCodes();
    
    // Check for redirect result
    await handleRedirectResult();
    
    // Add animation to container
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '1';
    }
    
    console.log("✅ Login system ready!");
});

// ==================== EXPORT FOR MODULE ====================
export { auth, db };
