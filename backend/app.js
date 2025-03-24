const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/config');
const { setupAssociations } = require('./models/Post');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('./config/passport');
require('dotenv').config();

console.log(process.env.DB_USER, process.env.DB_PASSWORD);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Setup model associations
setupAssociations();

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3001;

// Test database connection and sync models
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    return sequelize.sync({ alter: true }); // Use alter instead of force to preserve data
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

