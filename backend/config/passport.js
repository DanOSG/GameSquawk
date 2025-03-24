const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const SteamStrategy = require('passport-steam').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate } = require('@xboxreplay/xboxlive-auth');
require('dotenv').config();

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy (email/password)
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Find user by email
      const user = await User.findOne({ where: { email } });
      
      // Check if user exists
      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Discord Strategy
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists in database
    let user = await User.findOne({ where: { discordId: profile.id } });
    
    if (user) {
      // If user exists, return the user
      return done(null, user);
    }
    
    // If the user doesn't exist, check if email is already in use
    if (profile.email) {
      const existingUser = await User.findOne({ where: { email: profile.email } });
      
      if (existingUser) {
        // Link Discord account to existing user
        existingUser.discordId = profile.id;
        await existingUser.save();
        return done(null, existingUser);
      }
    }
    
    // Create a new user
    user = await User.create({
      username: profile.username,
      email: profile.email || `discord_${profile.id}@placeholder.com`,
      discordId: profile.id,
      password: await bcrypt.hash(Math.random().toString(36).substring(2), 10) // Random password
    });
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Steam Strategy
passport.use(new SteamStrategy({
  returnURL: process.env.STEAM_RETURN_URL,
  realm: process.env.STEAM_REALM,
  apiKey: process.env.STEAM_API_KEY
},
async (identifier, profile, done) => {
  try {
    const steamId = profile.id;
    let user = await User.findOne({ where: { steamId } });
    
    if (user) {
      return done(null, user);
    }
    
    // Create new user with Steam info
    user = await User.create({
      username: profile.displayName || `Steam User ${steamId.substring(0, 5)}`,
      email: `steam_${steamId}@placeholder.com`,
      steamId: steamId,
      password: await bcrypt.hash(Math.random().toString(36).substring(2), 10), // Random password
      avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
    });
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Xbox Live authentication is handled manually, not through passport strategy

module.exports = passport; 