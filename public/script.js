// public/script.js

// --- 1. SETUP ---
const socket = io({ autoConnect: false });

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
const body = document.body;
const promptSpan = document.querySelector('.prompt');
const typingIndicator = document.getElementById('typing-indicator');
const onlineCount = document.getElementById('online-count');

let currentUser = '';
let typingTimeout;

// --- 2. FONTS ARRAY (0-5) ---
// Expanded Font List
const fonts = [
    "'Courier New', Courier, monospace", // 0: Default
    "'VT323', monospace",                // 1: Retro
    "'Fira Code', monospace",            // 2: Dev
    "'Press Start 2P', cursive",         // 3: Arcade
    "'Source Code Pro', monospace",      // 4: Clean
    "'Roboto Mono', monospace",          // 5: Modern
    "'Orbitron', sans-serif",            // 6: Sci-Fi (New)
    "'Share Tech Mono', monospace"       // 7: Hacker (New)
];

// --- 3. EXPANDED EMOJI MAP ---
const emojiMap = {
    // Faces
    ':smile:': '😊', ':laugh:': '😂', ':cool:': '😎', ':wink:': '😉',
    ':cry:': '😭', ':love:': '😍', ':hmm:': '🤔', ':scared:': '😱',
    ':clown:': '🤡', ':devil:': '😈', ':ghost:': '👻', ':alien:': '👽',
    ':robot:': '🤖', ':poop:': '💩', ':skull:': '💀',
    // Hands
    ':thumbsup:': '👍', ':thumbsdown:': '👎', ':wave:': '👋', ':pray:': '🙏',
    ':muscle:': '💪', ':clap:': '👏',
    // Objects/Nature
    ':fire:': '🔥', ':rocket:': '🚀', ':heart:': '❤️', ':star:': '⭐',
    ':bomb:': '💣', ':check:': '✅', ':x:': '❌', ':warning:': '⚠️',
    ':money:': '💸', ':lock:': '🔒', ':key:': '🔑', ':coffee:': '☕',
    ':beer:': '🍺', ':pizza:': '🍕', ':game:': '🎮', ':cat:': '🐱',
    ':dog:': '🐶', ':dragon:': '🐉', ':party:': '🎉'
};

// --- 4. AUTHENTICATION ---
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
                loginMsg.innerText = 'Success. Please Login.';
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

if (btnLogin) btnLogin.addEventListener('click', () => authUser('login'));
if (btnRegister) btnRegister.addEventListener('click', () => authUser('register'));

function startChat() {
    loginOverlay.style.display = 'none';
    mainInterface.style.display = 'flex';
    socket.connect();
    promptSpan.innerText = `${currentUser}@chat:~$`;
    inputField.focus();
}

// --- 5. PARSER LOGIC ---
function parseEmojis(text) {
    let newText = text;
    for (const [key, value] of Object.entries(emojiMap)) {
        newText = newText.split(key).join(`<span class="emoji">${value}</span>`);
    }
    return newText;
}

chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    let msg = inputField.value.trim();
    if (!msg) return;

    if (msg.startsWith('/')) {
        handleCommand(msg);
    } else {
        msg = parseEmojis(msg);
        socket.emit('chat message', { user: currentUser, text: msg });
    }
    inputField.value = '';
});

// --- 6. ADVANCED COMMANDS ---
function handleCommand(cmd) {
    const parts = cmd.split(' ');
    const command = parts[0].toLowerCase();
    const arg = parts[1];

    // --- LIST ALL COMMANDS ---
    if (command === '/commands' || command === '/help') {
        addMessageToScreen('System', '--- AVAILABLE COMMANDS ---', true);
        addMessageToScreen('System', '/theme [green|amber|white|matrix] - Change Colors', true);
        addMessageToScreen('System', '/font [0-7] - Change Font Style', true);
        addMessageToScreen('System', '/bg [url] - Set Background Image', true);
        addMessageToScreen('System', '/color [hex_text] [hex_bg] - Custom Colors', true);
        addMessageToScreen('System', '/clear - Clear Screen', true);
        addMessageToScreen('System', '/reset - Reset UI to Default', true);
        addMessageToScreen('System', '/nuke [password] - Factory Reset Server', true);
        return; // Stop here
    }

    if (command === '/clear') {
        messagesDiv.innerHTML = '';
        addMessageToScreen('System', 'Console cleared.', true);
    }
    // --- THEMES ---
    else if (command === '/theme') {
        body.style = ''; // CLEAR inline styles (fixes matrix bug)
        body.className = ''; // CLEAR existing classes

        if (arg === 'amber') body.classList.add('amber-theme');
        else if (arg === 'white') body.classList.add('white-theme');
        else if (arg === 'matrix') body.classList.add('matrix-mode');

        addMessageToScreen('System', `Theme set to: ${arg || 'default'}`, true);
    }
    // --- FONTS ---
    else if (command === '/font') {
        const index = parseInt(parts[1]);
        if (index >= 0 && index < fonts.length) {
            document.documentElement.style.setProperty('--font-stack', fonts[index]);
            addMessageToScreen('System', `Font set to ID ${index}`, true);
        } else {
            addMessageToScreen('System', `Available Fonts: 0-${fonts.length - 1}`, true);
        }
    }
    // --- CUSTOM BG ---
    else if (command === '/bg') {
        const url = parts[1];
        if (url) {
            body.style.backgroundImage = `url(${url})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            addMessageToScreen('System', 'Background updated.', true);
        }
    }
    // --- CUSTOM COLORS ---
    else if (command === '/color') {
        const tColor = parts[1];
        const bColor = parts[2];
        if (tColor && bColor) {
            document.documentElement.style.setProperty('--text-color', tColor);
            document.documentElement.style.setProperty('--bg-color', bColor);
            document.documentElement.style.setProperty('--prompt-color', tColor);
            addMessageToScreen('System', 'Custom colors applied.', true);
        }
    }
    // --- RESET ---
    else if (command === '/reset') {
        body.style = '';
        body.className = '';
        document.documentElement.style = '';
        addMessageToScreen('System', 'UI Reset to Factory Default.', true);
    }
    // --- NUKE ---
    else if (command === '/nuke') {
        if (parts[1]) socket.emit('factory reset', parts[1]);
        else addMessageToScreen('System', 'Usage: /nuke [password]', true);
    }
    else {
        addMessageToScreen('System', `Unknown command: ${command}`, true);
    }
}
// --- 7. LISTENERS ---
socket.on('chat message', (data) => addMessageToScreen(data.user, data.text));
socket.on('message', (data) => addMessageToScreen('System', data.text, true));
socket.on('load history', (history) => {
    messagesDiv.innerHTML = '';
    addMessageToScreen('System', '--- History Loaded ---', true);
    history.forEach((msg) => addMessageToScreen(msg.user, msg.text));
});
socket.on('user count', (c) => { if (onlineCount) onlineCount.innerText = `Nodes: ${c}`; });
socket.on('typing', (u) => { if (typingIndicator) typingIndicator.innerText = `> ${u} typing...`; });
socket.on('stop typing', () => { if (typingIndicator) typingIndicator.innerText = ''; });

inputField.addEventListener('input', () => {
    socket.emit('typing', currentUser);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('stop typing'), 1000);
});

function addMessageToScreen(user, text, isSystem = false) {
    const div = document.createElement('div');
    div.classList.add('message-line');
    if (isSystem) div.classList.add('system-msg');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `[${time}] <strong>${user}:</strong> ${text}`;

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}