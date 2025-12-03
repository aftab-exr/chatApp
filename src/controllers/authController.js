// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { User } = require('../models/ChatModels');

exports.register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({ username, password: hashedPassword });

        res.status(201).json({ success: true, message: 'User registered' });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        res.json({ success: true, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
};