// src/app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const connectDB = require('./config/db'); // Import DB
const authRoutes = require('./routes/userroutes'); // Ensure casing matches file!
const socketHandler = require('./sockets/chatSocket');

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" } // Allow connections from Mobile Apps
});

// Connect to Database
connectDB();

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Socket Logic
socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`> Terminal Chat System online on port ${PORT}`);
});