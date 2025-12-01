// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const { saveUser, findUser } = require('../utils/fileStore');

exports.register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user exists
    if (findUser(username)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password (encrypt it)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save
    saveUser(username, hashedPassword);
    res.json({ success: true, message: 'User registered' });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    
    const user = findUser(username);
    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    // Compare the plain password with the encrypted one
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({ success: true, username: user.username });
};