// src/app.js
require('dotenv').config(); // Load settings
const express = require('express');
const http = require('http');
const path = require('path');
const authRoutes = require('./routes/authroutes');
const socketHandler = require('./sockets/chatSocket'); // We will create this next

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Middleware (Settings)
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.json());
app.use('/api/auth', authRoutes);

// Initialize Socket Logic
socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`> Terminal Chat System online on port ${PORT}`);
});