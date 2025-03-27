const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active users in the lobby
const activeUsers = new Map(); // socketId -> user data

// Store user sessions to prevent duplicates
const userSessions = new Map(); // userId -> socketId

// Store chat messages
let chatMessages = [];

// Set up chat clearing interval - 12 hours
const CHAT_CLEAR_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Initialize the lobby service with socket.io instance
const initLobbyService = (io) => {
  // Create a lobby namespace
  const lobbyNamespace = io.of('/lobby');
  
  // Set up interval to clear chat history every 12 hours
  const clearChatInterval = setInterval(() => {
    console.log('Clearing chat messages (12-hour interval)');
    chatMessages = [];
    
    // Broadcast chat clear event to all connected clients
    lobbyNamespace.emit('chatCleared', {
      timestamp: new Date().toISOString(),
      message: 'Chat history has been cleared (12-hour interval)'
    });
  }, CHAT_CLEAR_INTERVAL);

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
      
      // Check if user already has an active session
      if (userSessions.has(decoded.userId)) {
        const existingSocketId = userSessions.get(decoded.userId);
        const existingSocket = lobbyNamespace.sockets.get(existingSocketId);
        
        if (existingSocket) {
          console.log(`User ${decoded.userId} already has an active session, preventing duplicate`);
          socket.duplicateSession = true;
        } else {
          // Old socket no longer valid, update with this one
          userSessions.set(decoded.userId, socket.id);
        }
      } else {
        // New session, register it
        userSessions.set(decoded.userId, socket.id);
      }
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle socket connections
  lobbyNamespace.on('connection', (socket) => {
    console.log(`User connected to lobby: ${socket.userId} with socket ID: ${socket.id}`);
    
    // Check if this is a duplicate session
    if (socket.duplicateSession) {
      console.log(`Rejecting duplicate session for user ${socket.userId}`);
      socket.emit('duplicateSession');
      socket.disconnect();
      return;
    }
    
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
        
        // Send chat history to the newly connected client
        socket.emit('chatHistory', chatMessages);
        console.log(`Sending chat history to ${socket.id} with ${chatMessages.length} messages`);
        
        console.log(`User ${user.username} (${socket.userId}) joined the lobby. Total users: ${activeUsers.size}`);
      } catch (error) {
        console.error('Error in joinLobby event:', error);
      }
    });
    
    // Handle chat messages
    socket.on('chatMessage', (message) => {
      console.log(`Chat message from ${socket.username}: ${message.text}`);
      
      // Add server timestamp and store message
      const enhancedMessage = {
        ...message,
        serverTimestamp: new Date().toISOString()
      };
      
      // Store the message
      chatMessages.push(enhancedMessage);
      
      // Limit chat history to the most recent 500 messages
      if (chatMessages.length > 500) {
        chatMessages = chatMessages.slice(chatMessages.length - 500);
      }
      
      // Broadcast message to all users EXCEPT sender (they already have it in UI)
      socket.broadcast.emit('chatMessage', enhancedMessage);
    });
    
    // WebRTC signaling with more debugging
    socket.on('callUser', ({ to, signal }) => {
      console.log(`User ${socket.id} is calling user ${to}`);
      console.log(`Signal type: ${signal.type}`);
      
      // Check if the target user exists
      if (activeUsers.has(to)) {
        console.log(`Target user ${to} is active, forwarding call`);
        
        // Use socket.io emit with optional acknowledgment callback
        lobbyNamespace.to(to).emit('callUser', {
          from: socket.id,
          signal
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
        
        // Forward the answer signal
        lobbyNamespace.to(to).emit('callAccepted', {
          from: socket.id,
          signal
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
        try {
          // Forward the ICE candidate immediately
          lobbyNamespace.to(to).emit('iceCandidate', {
            from: socket.id,
            candidate
          });
        } catch (error) {
          console.error(`Error forwarding ICE candidate to ${to}:`, error);
          socket.emit('iceCandidateError', {
            to,
            error: 'Error forwarding ICE candidate'
          });
        }
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
        
        // Remove user session if this was their active session
        if (userSessions.get(user.userId) === socket.id) {
          userSessions.delete(user.userId);
          console.log(`Removed session for user ${user.userId}`);
        }
        
        // Broadcast user left event
        socket.broadcast.emit('userLeft', socket.id);
      }
    });
  });

  // Debug interval to log active sessions
  setInterval(() => {
    console.log('Active user sessions:', userSessions.size);
    console.log('Active socket connections:', activeUsers.size);
  }, 60000); // Log every minute

  console.log('Lobby service initialized with chat functionality and duplicate session prevention');
  
  // Clean up interval when the server shuts down
  process.on('SIGTERM', () => {
    console.log('Cleaning up chat clear interval');
    clearInterval(clearChatInterval);
  });
  
  process.on('SIGINT', () => {
    console.log('Cleaning up chat clear interval');
    clearInterval(clearChatInterval);
  });
};

module.exports = {
  initLobbyService
}; 