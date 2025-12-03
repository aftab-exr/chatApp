// src/sockets/chatSocket.js
const { Message, User } = require('../models/ChatModels');

module.exports = (io) => {
    io.on('connection', async (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        // --- 1. INITIAL SETUP ---
        // Send User Count to everyone
        io.emit('user count', io.engine.clientsCount);

        // Auto-join 'global' room on connection
        socket.join('global');

        // Load Global History (Last 50 messages)
        try {
            const history = await Message.find({ room: 'global' })
                                         .sort({ timestamp: 1 })
                                         .limit(50);
            socket.emit('load history', history);
        } catch (error) {
            console.error('History Error:', error);
        }

        // --- 2. ROOM SWITCHING LOGIC ---
        socket.on('join room', async (roomName) => {
            // Leave all current rooms (except the socket's own ID)
            const currentRooms = Array.from(socket.rooms);
            currentRooms.forEach((r) => {
                if (r !== socket.id) socket.leave(r);
            });

            // Join the new room
            socket.join(roomName);

            // Load History for THIS specific room
            try {
                const roomHistory = await Message.find({ room: roomName })
                                             .sort({ timestamp: 1 })
                                             .limit(50);
                socket.emit('load history', roomHistory);
                
                // Optional: Announce join (only to user)
                socket.emit('message', { user: 'System', text: `Joined channel: ${roomName}` });
            } catch (err) {
                console.error('Room Join Error:', err);
            }
        });

        // --- 3. CHAT MESSAGE LOGIC ---
        socket.on('chat message', async (data) => {
            if (!data.text || !data.user) return;

            // Determine which room the user is currently in
            // (Filters out their own socket ID to find the real room name)
            const room = Array.from(socket.rooms).find(r => r !== socket.id) || 'global';

           try {
            const newMsg = await Message.create({
                room: room,
                user: data.user,
                text: data.text
            });

            // Broadcast to the room
            io.to(room).emit('chat message', data);

            // --- NEW: DM NOTIFICATION LOGIC ---
            // If this is a DM (contains '_'), notify the other user
            if (room.includes('_')) {
                const users = room.split('_');
                const recipient = users.find(u => u !== data.user);
                
                // We need to find the recipient's socket to send a notification
                // (Broadcasting to 'global' is a simple hack for now so we don't need a user-socket map)
                // In a perfect world, we map Username -> SocketID. 
                // For now, we emit to everyone, and client checks if it's for them.
                io.emit('new dm', { from: data.user, room: room }); 
            }

        } catch (error) {
            console.error('Save Error:', error);
        }
        });

        // --- 4. TYPING INDICATORS ---
        // We broadcast to the specific room so #gaming doesn't see #global typing
        socket.on('typing', (user) => {
            const room = Array.from(socket.rooms).find(r => r !== socket.id) || 'global';
            socket.to(room).emit('typing', user);
        });

        socket.on('stop typing', () => {
            const room = Array.from(socket.rooms).find(r => r !== socket.id) || 'global';
            socket.to(room).emit('stop typing');
        });

        // --- 5. ADMIN TOOLS (THE NUKE) ---
        socket.on('factory reset', async (password) => {
            if (password === "admin") { // Change this password if you want
                try {
                    await Message.deleteMany({});
                    await User.deleteMany({});
                    
                    // Alert everyone in every room
                    io.emit('message', { user: 'SYSTEM', text: '⚠️ CRITICAL: CLOUD DATABASE WIPED.' });
                    io.emit('load history', []); // Clear screens
                    console.log('>> ADMIN PERMED FACTORY RESET');
                } catch (err) {
                    console.error('Nuke Error:', err);
                }
            }
        });

        // --- 6. DISCONNECT ---
        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            io.emit('user count', io.engine.clientsCount);
        });
    });
};