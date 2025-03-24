const express = require('express');
const { register, login } = require('../controllers/authController');
const router = express.Router();
const passport = require('../config/passport');
const { authenticate } = require('@xboxreplay/xboxlive-auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Regular email/password routes
router.post('/register', register);
router.post('/login', login);

// Discord authentication routes
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: process.env.CLIENT_URL || 'http://localhost:3000'
}), (req, res) => {
  // Generate JWT token for the authenticated user
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&username=${req.user.username}`);
});

// Steam authentication routes
router.get('/steam', passport.authenticate('steam'));
router.get('/steam/callback', passport.authenticate('steam', {
  failureRedirect: process.env.CLIENT_URL || 'http://localhost:3000'
}), (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}&username=${req.user.username}`);
});

// Xbox Live authentication route (manual implementation)
router.post('/xbox', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Authenticate with Xbox Live
    const xboxAuth = await authenticate(email, password);
    
    // Check if user with this Xbox ID exists
    let user = await User.findOne({ 
      where: { xboxId: xboxAuth.xuid }
    });
    
    if (!user) {
      // Check if email exists in our system
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        // Link Xbox ID to existing user
        existingUser.xboxId = xboxAuth.xuid;
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        user = await User.create({
          username: xboxAuth.display_claims?.gtg || `Xbox User ${xboxAuth.xuid.substring(0, 5)}`,
          email,
          password: await bcrypt.hash(Math.random().toString(36).substring(2), 10), // Random password
          xboxId: xboxAuth.xuid
        });
      }
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ 
      token, 
      username: user.username 
    });
  } catch (error) {
    console.error('Xbox authentication error:', error);
    res.status(401).json({ message: 'Xbox authentication failed' });
  }
});

module.exports = router; 