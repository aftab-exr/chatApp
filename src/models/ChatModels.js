// src/models/ChatModels.js
const mongoose = require('mongoose');

// 1. User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
});

// 2. Message Schema
const messageSchema = new mongoose.Schema({
    room: { type: String, default: 'global' }, // Future-proofing for Rooms
    user: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { User, Message };