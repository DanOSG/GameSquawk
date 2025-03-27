require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e7 // 10 MB for audio chunks
});

// Store active rooms and users
const activeRooms = new Map(); // roomId -> Set of socket IDs
const userMeta = new Map();    // socket ID -> user metadata

// Keep track of user sessions
const userSessions = new Map(); // userId -> socketId

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Handle user joining a room
  socket.on('joinRoom', (data) => {
    try {
      const { roomId, userId, username, avatar } = data;
      
      // Check for duplicate sessions
      if (userSessions.has(userId)) {
        const existingSocketId = userSessions.get(userId);
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        
        if (existingSocket && existingSocketId !== socket.id) {
          console.log(`User ${userId} already has an active session`);
          socket.emit('duplicateSession');
          return;
        }
      }
      
      // Update user session
      userSessions.set(userId, socket.id);
      
      // Store user metadata
      userMeta.set(socket.id, {
        userId,
        username,
        avatar,
        roomId,
        speaking: false
      });
      
      // Join the room
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      
      // Add user to room
      activeRooms.get(roomId).add(socket.id);
      
      // Get all users in the room
      const usersInRoom = Array.from(activeRooms.get(roomId)).map(id => {
        const meta = userMeta.get(id);
        return {
          id,
          userId: meta.userId,
          username: meta.username,
          avatar: meta.avatar,
          speaking: meta.speaking
        };
      });
      
      // Notify all users in the room about the new user
      socket.to(roomId).emit('userJoined', {
        id: socket.id,
        userId,
        username,
        avatar,
        speaking: false
      });
      
      // Send the list of users to the new user
      socket.emit('roomUsers', usersInRoom);
      
      console.log(`User ${username} (${userId}) joined room ${roomId}`);
    } catch (error) {
      console.error('Error in joinRoom event:', error);
    }
  });
  
  // Handle audio chunk
  socket.on('audioChunk', (data) => {
    const { chunk } = data;
    const meta = userMeta.get(socket.id);
    
    if (!meta) return;
    
    const { roomId, speaking } = meta;
    
    // If user wasn't speaking before, notify others
    if (!speaking) {
      meta.speaking = true;
      
      // Notify other users that this user started speaking
      socket.to(roomId).emit('userSpeaking', {
        id: socket.id,
        speaking: true
      });
    }
    
    // Reset the speaking timeout
    if (meta.speakingTimeout) {
      clearTimeout(meta.speakingTimeout);
    }
    
    // Set a timeout to stop speaking indicator after a short period
    meta.speakingTimeout = setTimeout(() => {
      if (meta && meta.speaking) {
        meta.speaking = false;
        
        // Notify other users that this user stopped speaking
        socket.to(meta.roomId).emit('userSpeaking', {
          id: socket.id,
          speaking: false
        });
      }
    }, 500);
    
    // Relay audio chunk to everyone else in the room
    socket.to(roomId).emit('audioChunk', {
      id: socket.id,
      chunk
    });
  });
  
  // Handle mute status update
  socket.on('muteUpdate', (muted) => {
    const meta = userMeta.get(socket.id);
    if (!meta) return;
    
    // Notify all users in the room
    socket.to(meta.roomId).emit('userMuteUpdate', {
      id: socket.id,
      muted
    });
  });
  
  // Handle user leaving
  socket.on('disconnect', () => {
    const meta = userMeta.get(socket.id);
    
    if (meta) {
      const { userId, username, roomId } = meta;
      
      // Remove from room if exists
      if (activeRooms.has(roomId)) {
        activeRooms.get(roomId).delete(socket.id);
        
        // If room is empty, remove it
        if (activeRooms.get(roomId).size === 0) {
          activeRooms.delete(roomId);
        }
      }
      
      // Remove user session if it's this socket
      if (userSessions.get(userId) === socket.id) {
        userSessions.delete(userId);
      }
      
      // Remove metadata
      userMeta.delete(socket.id);
      
      // Notify other users in the room
      socket.to(roomId).emit('userLeft', socket.id);
      
      console.log(`User ${username} (${userId}) left room ${roomId}`);
    }
    
    console.log(`User disconnected: ${socket.id}`);
  });
  
  // Handle chat messages
  socket.on('chatMessage', (message) => {
    const meta = userMeta.get(socket.id);
    if (!meta) return;
    
    const { roomId } = meta;
    
    // Add server timestamp
    const enhancedMessage = {
      ...message,
      serverTimestamp: new Date().toISOString()
    };
    
    // Broadcast to all other users in the room
    socket.to(roomId).emit('chatMessage', enhancedMessage);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', rooms: activeRooms.size, users: userMeta.size });
});

// Start the server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Media relay server running on port ${PORT}`);
}); 