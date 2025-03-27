# GameSquawk - Gaming Community Platform

## 📱 Overview
GameSquawk is a dynamic web platform designed for gamers to connect, share experiences, discuss games, and build a thriving gaming community. The application allows users to create posts about their favorite games, like and comment on others' content, and engage in gaming discussions.

## ✨ Features
- **User Authentication**: Secure signup and login system
- **Post Creation**: Share gaming experiences with markdown support
- **Categories**: Organize posts by game categories
- **Interaction**: Like, dislike, and comment on posts
- **Real-time Updates**: Instant notifications using Socket.io
- **Dark/Light Mode**: Customizable interface theme
- **Responsive Design**: Works on desktop and mobile devices
- **HTTPS Support**: Secure connection with SSL/TLS
- **Domain Configuration**: Custom domain support
- **Social Login**: Optional integration with Discord, Steam, and Xbox Live (requires additional setup)

## 🔧 Technology Stack
### Frontend
- React.js
- CSS for styling
- Socket.io client for real-time features
- Markdown rendering for rich content
- Environment variables for dynamic configuration

### Backend
- Node.js with Express
- MySQL database with Sequelize ORM
- Socket.io for real-time communication
- JWT for authentication
- Nginx as reverse proxy
- Let's Encrypt for SSL certificates
- Passport.js for authentication strategies

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- MySQL database
- npm or yarn package manager
- (Optional) Nginx for production deployment
- (Optional) Domain name for production deployment
- (Optional) API keys for social login providers

### Installation

#### Setting up the Backend
1. Navigate to the backend directory:
   ```
   cd GameSquawk/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Required variables
   PORT=3001
   DB_HOST=localhost
   DB_USER=your_database_username
   DB_PASSWORD=your_database_password
   DB_NAME=database_db
   JWT_SECRET=your_jwt_secret
   
   # Optional - Social login (Discord)
   # DISCORD_CLIENT_ID=your_discord_client_id
   # DISCORD_CLIENT_SECRET=your_discord_client_secret
   # DISCORD_CALLBACK_URL=http://localhost:3001/api/auth/discord/callback
   
   # Optional - Social login (Steam)
   # STEAM_API_KEY=your_steam_api_key
   # STEAM_RETURN_URL=http://localhost:3001/api/auth/steam/return
   # STEAM_REALM=http://localhost:3001/
   ```

   > **Important**: The application will run without the optional social login variables, but those login methods will be disabled. You must include `express-session` in your dependencies.

4. Start the server:
   ```
   node app.js
   ```

#### Setting up the Frontend
1. Navigate to the frontend directory:
   ```
   cd GameSquawk/frontend
   ```

2. Install dependencies:
   ```
   npm install --legacy-peer-deps
   ```

3. Create a `.env` file with:
   ```
   # For local development
   REACT_APP_API_URL=http://localhost:3001
   
   # For production with domain (uncomment when deploying)
   # REACT_APP_API_URL=https://yourdomain.com
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

### Production Deployment

#### Domain Configuration
1. Update your domain's DNS settings to point to your server IP
2. Configure Nginx:
   ```
   server {
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /socket.io {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /uploads {
           proxy_pass http://localhost:3001/uploads;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### SSL Configuration
1. Install Certbot and the Nginx plugin:
   ```
   apt update && apt install -y certbot python3-certbot-nginx
   ```

2. Obtain and configure SSL certificate:
   ```
   certbot --nginx -d yourdomain.com
   ```

3. Update frontend environment:
   ```
   # frontend/.env
   REACT_APP_API_URL=https://yourdomain.com
   ```

4. Rebuild the frontend:
   ```
   cd frontend && npm run build
   ```

#### Using PM2 for Process Management
1. Install PM2 globally:
   ```
   npm install -g pm2
   ```

2. Start the backend:
   ```
   cd backend && pm2 start app.js --name "gamesquawk-backend"
   ```

3. Serve the frontend build:
   ```
   cd frontend && pm2 start npm --name "gamesquawk-frontend" -- start
   ```

4. Configure PM2 to start on boot:
   ```
   pm2 startup
   pm2 save
   ```

## 📖 How to Use
1. **Register/Login**: Create an account or log in to access features
2. **Create Posts**: Share your gaming experiences using the post form
3. **Interact**: Like posts and leave comments to engage with others
4. **Customize**: Switch between dark and light mode for comfortable viewing

## 🔧 Troubleshooting

### Missing Environment Variables
If you encounter OAuth or authentication errors during startup:
1. Check if your backend `.env` file has all required variables
2. For social login, ensure all provider-specific variables are set or comment them out if not needed
3. Make sure to install the `express-session` package: `npm install express-session`

### Dependency Compatibility Issues
If you encounter errors related to dependencies when installing or running the application (especially with React 19), use the following commands:

For react-mde (markdown editor):
```
npm install react-mde --legacy-peer-deps
```

For socket.io-client (real-time communication):
```
npm install socket.io-client --legacy-peer-deps
```

These issues occur because some packages have peer dependencies on older React versions, but the project uses React 19. The `--legacy-peer-deps` flag allows npm to ignore peer dependency conflicts.

### SSL/HTTPS Issues
If you encounter mixed content warnings:
1. Ensure your `.env` file has `REACT_APP_API_URL` set to use `https://` protocol
2. Rebuild the frontend application after making changes
3. Check browser console for specific error messages

### File Upload Issues
If profile images are not showing after upload:
1. Verify that the Nginx configuration includes the `/uploads` location block
2. Check the permissions on the `/backend/public/uploads` directory
3. Restart Nginx after making configuration changes

## 📱 Project Structure
```
GameSquawk/
├── backend/          # Server-side code
│   ├── config/       # Database configuration
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Auth middleware
│   ├── models/       # Database models
│   └── routes/       # API endpoints
│
└── frontend/         # Client-side code
    ├── public/       # Static files
    └── src/          # React components
        └── components/ # UI components
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
All rights reserved. This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without express permission from the author.

## Voice Chat Solution

The voice chat feature uses a dedicated media relay server for audio transmission instead of WebRTC peer-to-peer connections. This approach provides more reliability and better performance for multi-user voice chat.

### Project Structure

- `frontend/` - React frontend application
- `backend/` - Main API server handling authentication, chat history, etc.
- `media-relay-server/` - Dedicated server for handling audio streaming

## Setup Instructions

### Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd GameSquawk
```

2. Set up and start the backend server:
```bash
cd backend
npm install
npm run dev
```

3. Set up and start the media relay server:
```bash
cd media-relay-server
npm install
npm run dev
```

4. Set up and start the frontend application:
```bash
cd frontend
npm install
npm start
```

### Environment Configuration

#### Backend Server (.env)
```
PORT=3001
DB_CONNECTION_STRING=your_database_connection_string
JWT_SECRET=your_jwt_secret
```

#### Media Relay Server (.env)
```
PORT=3002
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_MEDIA_SERVER_URL=http://localhost:3002
REACT_APP_RAWG_API_KEY=your_rawg_api_key
```

## Testing the Voice Chat Feature

### Method 1: Using the Test Client

We've included a dedicated test client to verify the media relay server functionality:

**For Windows Users:**
```
cd media-relay-server
test.bat
```

**For Linux/Mac Users:**
```
cd media-relay-server
npm run test:room1
```

In another terminal:
```
cd media-relay-server
npm run test:room1:user2
```

### Method 2: Using the Application

1. Open two different browsers or incognito windows
2. Log in with two different accounts
3. Join the same lobby/room
4. Enable the microphone on both clients
5. Test voice communication

## Production Deployment

For detailed production deployment instructions, see:

- [VOICE-CHAT-SETUP.md](./VOICE-CHAT-SETUP.md) - Detailed setup for the voice chat solution
- `media-relay-server/deploy.ps1` - Windows deployment script
- `media-relay-server/deploy.sh` - Linux deployment script

## Troubleshooting

### Common Voice Chat Issues

1. **No sound in voice chat**
   - Check microphone permissions in your browser
   - Verify that the media server connection status shows as connected
   - Check browser console for any errors

2. **High voice chat latency**
   - The default settings balance quality and latency
   - For lower latency (at the cost of quality), you can adjust the recorder settings in the frontend code

3. **Connection issues**
   - Ensure both servers are running
   - Check the environment variables are correctly set
   - Verify that your browser supports the required audio APIs

## Contributing

Please follow the project's code style and contribution guidelines when submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
