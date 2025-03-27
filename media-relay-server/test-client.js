// Simple test client for the media relay server
const io = require('socket.io-client');
const readline = require('readline');

// Configuration
const MEDIA_SERVER_URL = process.env.MEDIA_SERVER_URL || 'http://localhost:3002';
const USER_ID = process.env.USER_ID || 'test-user-' + Math.floor(Math.random() * 1000);
const ROOM_ID = process.env.ROOM_ID || 'test-room';

console.log(`Starting test client with USER_ID: ${USER_ID}, ROOM_ID: ${ROOM_ID}`);
console.log(`Connecting to media server at: ${MEDIA_SERVER_URL}`);

// Create Socket.IO connection
const socket = io(MEDIA_SERVER_URL);

// Set up readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to media server');
  
  // Join room on connection
  socket.emit('join-room', { userId: USER_ID, roomId: ROOM_ID });
  console.log(`Joined room: ${ROOM_ID} as user: ${USER_ID}`);
  
  // Display help menu
  showHelp();
});

socket.on('disconnect', () => {
  console.log('Disconnected from media server');
});

socket.on('error', (error) => {
  console.error('Connection error:', error);
});

// Media server events
socket.on('user-joined', (data) => {
  console.log(`User joined: ${data.userId} in room: ${data.roomId}`);
});

socket.on('user-left', (data) => {
  console.log(`User left: ${data.userId} from room: ${data.roomId}`);
});

socket.on('audio-chunk', (data) => {
  console.log(`Received audio chunk from user: ${data.userId}, size: ${data.chunk.length} bytes`);
});

socket.on('users-in-room', (data) => {
  console.log('Users in room:', data.users);
});

// Command handlers
function showHelp() {
  console.log('\nAvailable commands:');
  console.log('  help      - Show this help menu');
  console.log('  users     - List users in the current room');
  console.log('  send      - Send a test audio chunk');
  console.log('  leave     - Leave the current room');
  console.log('  join      - Join a room (you\'ll be prompted for room ID)');
  console.log('  quit      - Disconnect and exit');
  console.log('\nEnter a command:');
}

function sendTestAudio() {
  // Create a dummy audio chunk (20 random bytes)
  const dummyAudio = Buffer.from(Array.from({ length: 20 }, () => Math.floor(Math.random() * 256)));
  
  socket.emit('audio-chunk', {
    userId: USER_ID,
    roomId: ROOM_ID,
    chunk: dummyAudio
  });
  
  console.log(`Sent test audio chunk (${dummyAudio.length} bytes)`);
}

function listUsers() {
  socket.emit('get-users', { roomId: ROOM_ID });
}

function leaveRoom() {
  socket.emit('leave-room', { userId: USER_ID, roomId: ROOM_ID });
  console.log(`Left room: ${ROOM_ID}`);
}

function joinRoom() {
  rl.question('Enter room ID to join: ', (newRoomId) => {
    const oldRoomId = ROOM_ID;
    ROOM_ID = newRoomId || 'test-room';
    
    socket.emit('join-room', { userId: USER_ID, roomId: ROOM_ID });
    console.log(`Left room: ${oldRoomId} and joined room: ${ROOM_ID}`);
  });
}

// Process user input
rl.on('line', (input) => {
  const command = input.trim().toLowerCase();
  
  switch (command) {
    case 'help':
      showHelp();
      break;
    case 'users':
      listUsers();
      break;
    case 'send':
      sendTestAudio();
      break;
    case 'leave':
      leaveRoom();
      break;
    case 'join':
      joinRoom();
      break;
    case 'quit':
      console.log('Disconnecting...');
      socket.disconnect();
      rl.close();
      break;
    default:
      console.log(`Unknown command: ${command}`);
      showHelp();
  }
});

// Handle app termination
process.on('SIGINT', () => {
  console.log('\nDisconnecting...');
  socket.disconnect();
  rl.close();
  process.exit(0);
}); 