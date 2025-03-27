# GameSquawk Media Relay Server

This server handles audio streaming between users in the GameSquawk application. Instead of using WebRTC, this server acts as a relay for audio chunks between connected clients.

## Setup Instructions

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=3002
   CLIENT_URL=http://localhost:3000
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Production Deployment on VPS

1. Clone the repository on your VPS
2. Install dependencies:
   ```
   npm install --production
   ```

3. Create a `.env` file with:
   ```
   PORT=3002
   CLIENT_URL=https://your-main-site-domain.com
   ```

4. Install PM2 for process management:
   ```
   npm install -g pm2
   ```

5. Start the server with PM2:
   ```
   pm2 start server.js --name media-relay
   ```

6. Set up PM2 to restart on system reboot:
   ```
   pm2 startup
   pm2 save
   ```

7. Set up a reverse proxy with Nginx or Apache to handle SSL

## API Documentation

This server uses Socket.IO for real-time communication.

### Socket.IO Events

#### Client -> Server
- `joinRoom`: Join an audio chat room
- `audioChunk`: Send an audio chunk to be relayed
- `muteUpdate`: Update mute status
- `chatMessage`: Send a chat message

#### Server -> Client
- `roomUsers`: List of users in the room
- `userJoined`: Event when a new user joins
- `userLeft`: Event when a user leaves
- `audioChunk`: Relayed audio chunk from another user
- `userSpeaking`: Event when a user starts/stops speaking
- `userMuteUpdate`: Event when a user mutes/unmutes
- `chatMessage`: Relayed chat message

### HTTP Endpoints
- `GET /health`: Health check endpoint 