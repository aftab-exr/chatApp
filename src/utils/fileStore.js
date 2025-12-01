// src/utils/fileStore.js
const fs = require('fs');
const path = require('path');

const msgPath = path.join(__dirname, '../data/messages.json');
const userPath = path.join(__dirname, '../data/users.json');

// --- HELPERS ---
const readJson = (p) => {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (e) { return []; }
};

const writeJson = (p, data) => {
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
};

// --- EXPORTED FUNCTIONS ---
const getMessages = () => readJson(msgPath);

const saveMessage = (user, text) => {
    const msgs = getMessages();
    const newMsg = { user, text, timestamp: new Date() };
    msgs.push(newMsg);
    writeJson(msgPath, msgs);
    return newMsg;
};

const getUsers = () => readJson(userPath);

const saveUser = (username, passwordHash) => {
    const users = getUsers();
    if (users.find(u => u.username === username)) return false;
    users.push({ username, password: passwordHash });
    writeJson(userPath, users);
    return true;
};

const findUser = (username) => {
    const users = getUsers();
    return users.find(u => u.username === username);
};

// THE NUKE FUNCTION
const resetAllData = () => {
    writeJson(msgPath, []);
    writeJson(userPath, []); 
    console.log(">> SYSTEM WIPE INITIATED.");
};

module.exports = { getMessages, saveMessage, saveUser, findUser, resetAllData };