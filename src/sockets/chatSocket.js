// src/sockets/chatSocket.js
const { getMessages, saveMessage, resetAllData } = require('../utils/fileStore');

module.exports = (io) => {
    io.on('connection', (socket) => {

        // 1. Send Live User Count (on Join)
        // Get count safely
        const count = io.engine.clientsCount;
        console.log("User connected. Total:", count); // <--- Check Server Terminal

        // Emit to everyone
        io.emit('user count', count);
        // 2. Handle Typing Events
        socket.on('typing', (user) => {
            // Send to everyone EXCEPT the person typing
            socket.broadcast.emit('typing', user);
        });

        socket.on('stop typing', () => {
            socket.broadcast.emit('stop typing');
        });

        // 3. Existing Load History Logic
        try {
            const history = getMessages();
            const recentHistory = history.slice(-50);
            socket.emit('load history', recentHistory);
        } catch (error) {
            console.error('Error loading history:', error);
        }

        // 4. Existing Chat Message Logic
        socket.on('chat message', (msg) => {
            if (!msg.text || !msg.user) return;
            saveMessage(msg.user, msg.text);
            io.emit('chat message', msg);
        });

        // 5. Handle Disconnect (Update Count)
        socket.on('disconnect', () => {
            io.emit('user count', io.engine.clientsCount);
        });
        // 6. NEW: Factory Reset Handler
        socket.on('factory reset', (password) => {
            const ADMIN_PASSWORD = "$bal.10b"; // <--- CHANGE THIS IF YOU WANT

            if (password === ADMIN_PASSWORD) {
                // 1. Wipe the files
                resetAllData();

                // 2. Tell EVERYONE the world has ended
                io.emit('message', { user: 'SYSTEM', text: '⚠️ CRITICAL: SERVER FACTORY RESET INITIATED.' });
                io.emit('message', { user: 'SYSTEM', text: 'All users and history have been wiped.' });
                
                // 3. Force clients to reload history (which is now empty)
                io.emit('load history', []);
            } else {
                // Wrong password? Publicly shame them (optional)
                socket.emit('message', { user: 'System', text: 'Access Denied: Invalid Authorization Code.' });
            }
        });
    });
};