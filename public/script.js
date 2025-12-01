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
const fonts = [
    "'Courier New', Courier, monospace", // 0: Default
    "'VT323', monospace",                // 1: Retro Terminal
    "'Fira Code', monospace",            // 2: Developer
    "'Press Start 2P', cursive",         // 3: 8-Bit Game
    "'Source Code Pro', monospace",      // 4: Clean
    "'Roboto Mono', monospace"           // 5: Modern
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

    // /bg https://example.com/image.jpg
    if (command === '/bg') {
        const url = parts[1];
        if (url) {
            body.style.backgroundImage = `url(${url})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            addMessageToScreen('System', 'Custom Background Set.', true);
        }
    }
    // /font 0-5
    else if (command === '/font') {
        const index = parseInt(parts[1]);
        if (index >= 0 && index < fonts.length) {
            document.documentElement.style.setProperty('--font-stack', fonts[index]);
            addMessageToScreen('System', `Font changed to Style ${index}.`, true);
        } else {
            addMessageToScreen('System', `Available Fonts: 0-${fonts.length - 1}`, true);
        }
    }
    // /color #text #bg
    else if (command === '/color') {
        const textColor = parts[1];
        const bgColor = parts[2];
        if (textColor && bgColor) {
            document.documentElement.style.setProperty('--text-color', textColor);
            document.documentElement.style.setProperty('--bg-color', bgColor);
            document.documentElement.style.setProperty('--prompt-color', textColor); // Match prompt to text
            addMessageToScreen('System', `Custom Colors Applied: ${textColor} on ${bgColor}`, true);
        } else {
            addMessageToScreen('System', 'Usage: /color #00ff00 #000000', true);
        }
    }
    // /theme (Preset)
    else if (command === '/theme') {
        body.style.backgroundImage = 'none'; // Reset BG image
        body.className = '';
        const arg = parts[1];

        if (arg === 'amber') body.classList.add('amber-theme');
        else if (arg === 'white') body.classList.add('white-theme');
        else if (arg === 'matrix') body.classList.add('matrix-mode');
        else body.className = '';

        addMessageToScreen('System', `Theme switched to: ${arg || 'default'}`, true);
    }
    else if (command === '/clear') {
        messagesDiv.innerHTML = '';
        addMessageToScreen('System', 'Console cleared.', true);
    }

    // 1. SOFT RESET (Visual Only)
    else if (command === '/reset') {
        // Remove all inline styles (Custom colors/backgrounds)
        document.documentElement.style = '';
        body.style = '';

        // Remove all theme classes
        body.className = '';

        // Reset Font
        document.documentElement.style.removeProperty('--font-stack');

        addMessageToScreen('System', 'Interface reset to factory defaults.', true);
    }

    // 2. ABSOLUTE RESET (Server Wipe)
    else if (command === '/nuke') {
        const password = parts[1];
        if (!password) {
            addMessageToScreen('System', '⚠️ WARNING: This will delete ALL users and messages.', true);
            addMessageToScreen('System', 'Usage: /nuke [admin_password]', true);
        } else {
            socket.emit('factory reset', password);
        }
    }

    else if (command === '/help') {
        addMessageToScreen('System', '--- COMMAND LIST ---', true);
        addMessageToScreen('System', '/bg [image_url] - Set background image', true);
        addMessageToScreen('System', '/font [0-5] - Change Font Style', true);
        addMessageToScreen('System', '/color [hex_text] [hex_bg] - Custom Colors', true);
        addMessageToScreen('System', '/theme [green|amber|white|matrix]', true);
        addMessageToScreen('System', '/clear - Clear screen', true);
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