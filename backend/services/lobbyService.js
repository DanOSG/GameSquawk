const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active users in the lobby
const activeUsers = new Map(); // socketId -> user data

// Initialize the lobby service with socket.io instance
const initLobbyService = (io) => {
  // Create a lobby namespace
  const lobbyNamespace = io.of('/lobby');

  // Authentication middleware for socket connections
  lobbyNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token || !token.startsWith('Bearer ')) {
        return next(new Error('Authentication error: Invalid token format'));
      }
      
      const tokenValue = token.split(' ')[1];
      const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
      
      // Attach user data to socket
      socket.userId = decoded.userId;
      
      // Get user details from the database
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.username = user.username;
      socket.avatar = user.avatar;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle socket connections
  lobbyNamespace.on('connection', (socket) => {
    console.log(`User connected to lobby: ${socket.userId} with socket ID: ${socket.id}`);
    
    // Send the connected user their socket ID for reference
    socket.emit('socketId', socket.id);
    
    // Handle join lobby event
    socket.on('joinLobby', async (userData) => {
      try {
        // Store user data
        const user = {
          id: socket.id,
          userId: socket.userId,
          username: userData.username || socket.username,
          avatar: userData.avatar,
          speaking: false,
          joinedAt: new Date()
        };
        
        activeUsers.set(socket.id, user);
        
        // Debug all connected users
        console.log("All active users:");
        activeUsers.forEach((u, id) => {
          console.log(`- User ${u.username} (${u.userId}) with socket ID: ${id}`);
        });
        
        // Broadcast user joined event to all clients except sender
        socket.broadcast.emit('userJoined', user);
        console.log(`Broadcasting 'userJoined' to all except ${socket.id}`);
        
        // Send current list of users to the newly connected client
        const allUsers = Array.from(activeUsers.values());
        socket.emit('lobbyUsers', allUsers);
        console.log(`Emitting 'lobbyUsers' to ${socket.id} with ${allUsers.length} users`);
        
        console.log(`User ${user.username} (${socket.userId}) joined the lobby. Total users: ${activeUsers.size}`);
      } catch (error) {
        console.error('Error in joinLobby event:', error);
      }
    });
    
    // WebRTC signaling with more debugging
    socket.on('callUser', ({ to, signal }) => {
      console.log(`User ${socket.id} is calling user ${to}`);
      console.log(`Signal type: ${signal.type}`);
      
      // Check if the target user exists
      if (activeUsers.has(to)) {
        console.log(`Target user ${to} is active, forwarding call`);
        
        // Use socket.io callback to ensure delivery
        lobbyNamespace.to(to).emit('callUser', {
          from: socket.id,
          signal
        }, (ack) => {
          // This callback will fire when the client acknowledges receipt
          if (ack && ack.received) {
            console.log(`User ${to} has acknowledged receipt of call`);
          }
        });
        
        // Also notify the caller that the call is being processed
        socket.emit('callPending', {
          to,
          status: 'connecting'
        });
      } else {
        console.log(`Target user ${to} is not active, call cannot be completed`);
        // Notify caller that the target user is not available
        socket.emit('callFailed', {
          to,
          reason: 'User not found or not active'
        });
      }
    });

    socket.on('answerCall', ({ to, signal }) => {
      console.log(`User ${socket.id} is answering call from ${to}`);
      console.log(`Answer signal type: ${signal.type}`);
      
      if (activeUsers.has(to)) {
        console.log(`Target user ${to} is active, forwarding answer`);
        
        lobbyNamespace.to(to).emit('callAccepted', {
          from: socket.id,
          signal
        }, (ack) => {
          if (ack && ack.received) {
            console.log(`User ${to} acknowledged receipt of answer`);
          }
        });
        
        // Notify answerer that the connection is established
        socket.emit('callConnected', {
          with: to,
          status: 'connected'
        });
      } else {
        console.log(`Target user ${to} is not active, answer cannot be delivered`);
        socket.emit('callFailed', {
          to,
          reason: 'User has disconnected'
        });
      }
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
      console.log(`User ${socket.id} is sending ICE candidate to ${to}`);
      
      if (activeUsers.has(to)) {
        lobbyNamespace.to(to).emit('iceCandidate', {
          from: socket.id,
          candidate
        });
      } else {
        console.log(`Target user ${to} is not active, ICE candidate cannot be delivered`);
        socket.emit('iceCandidateError', {
          to,
          error: 'User not found'
        });
      }
    });
    
    // Handle speaking status update
    socket.on('speakingUpdate', (speaking) => {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.speaking = speaking;
        activeUsers.set(socket.id, user);
        
        // Broadcast speaking status to all users
        socket.broadcast.emit('userSpeaking', {
          id: socket.id,
          speaking
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        console.log(`User ${user.username} (${socket.userId}) left the lobby`);
        activeUsers.delete(socket.id);
        
        // Broadcast user left event
        socket.broadcast.emit('userLeft', socket.id);
      }
    });
  });

  console.log('Lobby service initialized');
};

module.exports = {
  initLobbyService
}; 