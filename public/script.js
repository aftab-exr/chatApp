// public/script.js - PRODUCTION VERSION

// 1. SETUP
// const socket = io("https://your-app.onrender.com", { autoConnect: false }); // Use for Mobile
const socket = io({ autoConnect: false }); // Use for Web/Localhost

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const loginMsg = document.getElementById('login-msg');
const usernameInput = document.getElementById('u-name');
const passwordInput = document.getElementById('p-word');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const mainInterface = document.getElementById('main-interface');
const messagesDiv = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const inputField = document.getElementById('m');
const promptSpan = document.querySelector('.prompt');
const onlineCount = document.getElementById('online-count');
const typingIndicator = document.getElementById('typing-indicator');

let currentUser = '';
let currentRoom = 'global';
let typingTimeout;

// 2. AUTHENTICATION
async function authUser(endpoint) {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) return;

    try {
        const res = await fetch(`/api/auth/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            if (endpoint === 'register') {
                loginMsg.style.color = 'lime';
                loginMsg.innerText = 'Registration Successful. Please Login.';
            } else {
                currentUser = data.username;
                startChat();
            }
        } else {
            loginMsg.style.color = 'red';
            loginMsg.innerText = data.error;
        }
    } catch (err) { loginMsg.innerText = "Connection Error."; }
}

if(btnLogin) btnLogin.addEventListener('click', () => authUser('login'));
if(btnRegister) btnRegister.addEventListener('click', () => authUser('register'));

function startChat() {
    loginOverlay.style.display = 'none';
    mainInterface.style.display = 'flex';
    socket.connect();
    promptSpan.innerText = `${currentUser}@chat:~$`;
    inputField.focus();
}

// 3. ROOM & SIDEBAR LOGIC
function joinRoom(roomName) {
    if (currentRoom === roomName) return;

    // Add to sidebar if it doesn't exist
    addRoomToSidebar(roomName);

    // Update UI
    document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById(`btn-${roomName}`);
    if (btn) {
        btn.classList.add('active');
        btn.style.color = ''; // Remove notification color
        btn.style.fontWeight = '';
    }

    // Clear Screen & Switch
    messagesDiv.innerHTML = '';
    addMessageToScreen('System', `--- Switched to ${roomName} ---`, true);
    
    socket.emit('join room', roomName);
    currentRoom = roomName;
}

function addRoomToSidebar(roomName) {
    if (document.getElementById(`btn-${roomName}`)) return;

    const div = document.createElement('div');
    div.id = `btn-${roomName}`;
    div.classList.add('room-item');
    div.onclick = () => joinRoom(roomName);

    if (roomName.includes('_')) {
        // DM Formatting: Show the OTHER person's name
        const displayName = roomName.replace(currentUser, '').replace('_', '');
        div.innerText = `@ ${displayName}`;
        
        // Add to DM list (if you have a container for it, otherwise main list)
        const dmList = document.getElementById('dm-list') || document.getElementById('room-list');
        dmList.appendChild(div);
    } else {
        // Channel Formatting
        div.innerText = `# ${roomName}`;
        document.getElementById('room-list').appendChild(div);
    }
}

// 4. MESSAGING
chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    let msg = inputField.value.trim();
    if (!msg) return;

    if (msg.startsWith('/')) {
        handleCommand(msg);
    } else {
        socket.emit('chat message', { user: currentUser, text: msg });
    }
    inputField.value = '';
});

function handleCommand(cmd) {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    
    if (command === '/join' && parts[1]) joinRoom(parts[1]);
    else if (command === '/dm' && parts[1]) {
        // Create P2P Room ID: sort names so "A_B" is same as "B_A"
        const p2pRoom = [currentUser, parts[1]].sort().join('_');
        joinRoom(p2pRoom);
    }
    else if (command === '/clear') messagesDiv.innerHTML = '';
    else if (command === '/nuke' && parts[1]) socket.emit('factory reset', parts[1]);
    else addMessageToScreen('System', `Unknown command: ${command}`, true);
}

// 5. SOCKET LISTENERS
socket.on('chat message', (data) => addMessageToScreen(data.user, data.text));
socket.on('message', (data) => addMessageToScreen('System', data.text, true));

socket.on('load history', (history) => {
    messagesDiv.innerHTML = '';
    addMessageToScreen('System', `--- History: ${currentRoom} ---`, true);
    history.forEach(msg => addMessageToScreen(msg.user, msg.text));
});

// DM Notification Listener
socket.on('new dm', (data) => {
    // Check if this DM involves ME
    if (data.room.includes(currentUser)) {
        addRoomToSidebar(data.room);
        
        // Visual Alert if not currently in that room
        if (currentRoom !== data.room) {
            const btn = document.getElementById(`btn-${data.room}`);
            if (btn) {
                btn.style.color = 'cyan'; // Notification color
                btn.style.fontWeight = 'bold';
            }
        }
    }
});

socket.on('user count', (c) => { if(onlineCount) onlineCount.innerText = `Nodes: ${c}`; });
socket.on('typing', (u) => { if(typingIndicator) typingIndicator.innerText = `> ${u} is typing...`; });
socket.on('stop typing', () => { if(typingIndicator) typingIndicator.innerText = ''; });

// 6. TYPING DETECTION
inputField.addEventListener('input', () => {
    socket.emit('typing', currentUser);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('stop typing'), 1000);
});

// 7. HELPER
function addMessageToScreen(user, text, isSystem = false) {
    const div = document.createElement('div');
    div.classList.add('message-line');
    if (isSystem) div.classList.add('system-msg');
    div.innerHTML = `<strong>${user}:</strong> ${text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}