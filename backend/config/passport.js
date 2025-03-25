const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

module.exports = passport; 