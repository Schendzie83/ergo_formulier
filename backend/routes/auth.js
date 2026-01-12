const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    console.log(`Login attempt for username: '${username}'`);
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.log(`Use '${username}' NOT found in database.`);
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }
    console.log(`User '${username}' found. Hashed password in DB: ${user.passwordHash ? 'Yes' : 'No'}`);

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      console.log(`Password check failed for user '${username}'.`);
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }
    console.log(`Password check successful for user '${username}'. Generating token...`);

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username }, 
      process.env.JWT_SECRET || 'your_jwt_secret', 
      { expiresIn: '8h' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const authenticateToken = require('../middleware/auth');

// PUT /change-password - Change current user's password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Huidige wachtwoord is onjuist' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedPassword;
    await user.save();

    res.json({ message: 'Wachtwoord succesvol gewijzigd' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /users (List all users) - Protected
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.findAll({ 
            attributes: ['id', 'username', 'email', 'createdAt'] // Don't return passwordHash
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /register - Create new user - Protected
router.post('/register', authenticateToken, async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Check if user exists
        const existing = await User.findOne({ where: { username } });
        if (existing) {
            return res.status(400).json({ error: 'Gebruikersnaam bestaat al' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({
            username,
            passwordHash: hashedPassword,
            email
        });
        
        res.status(201).json({ message: "Gebruiker aangemaakt" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /users/:id - Delete a user - Protected
router.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
        const userIdToDelete = parseInt(req.params.id);
        
        // Prevent deleting yourself
        if (req.user.id === userIdToDelete) {
            return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen' });
        }

        const user = await User.findByPk(userIdToDelete);
        if (!user) {
            return res.status(404).json({ error: 'Gebruiker niet gevonden' });
        }

        await user.destroy();
        res.json({ message: 'Gebruiker verwijderd' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
