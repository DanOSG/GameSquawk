# GameSquawk - Gaming Community Platform

## 📱 Overview
GameSquawk is a dynamic web platform designed for gamers to connect, share experiences, discuss games, and build a thriving gaming community. The application allows users to create posts about their favorite games, like and comment on others' content, engage in gaming discussions, participate in voice chat rooms, and share gameplay videos.

## ✨ Features
- **User Authentication**: Secure signup and login system
- **Post Creation**: Share gaming experiences with markdown support
- **Categories**: Organize posts by game categories
- **Interaction**: Like, dislike, and comment on posts
- **Real-time Updates**: Instant notifications using Socket.io
- **Voice Chat**: Dedicated media relay server for high-quality voice communication
- **Video Sharing**: Upload and share gameplay videos with Google Drive integration
- **Dark/Light Mode**: Customizable interface theme
- **Responsive Design**: Works on desktop and mobile devices
- **HTTPS Support**: Secure connection with SSL/TLS
- **Domain Configuration**: Custom domain support
- **Media Handling**: Dedicated media relay server for voice chat and future media features

## 🔧 Technology Stack
### Frontend
- React.js
- CSS for styling
- Socket.io client for real-time features
- Markdown rendering for rich content
- WebSocket audio streaming for voice chat
- Environment variables for dynamic configuration

### Backend
- Node.js with Express
- MySQL database with Sequelize ORM
- Socket.io for real-time communication
- JWT for authentication
- Nginx as reverse proxy
- Let's Encrypt for SSL certificates
- Passport.js for authentication strategies

### Media Relay Server
- Dedicated WebSocket server for voice chat
- Optimized for low-latency audio streaming
- Scalable architecture for multiple rooms
- PM2 for process management

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- MySQL database
- npm or yarn package manager
- (Optional) Nginx for production deployment
- (Optional) Domain name for production deployment
- (Optional) Second VPS for media relay server

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
   DB_NAME=gamesquawk_db
   JWT_SECRET=your_jwt_secret
   
   # Client URL (for redirects)
   CLIENT_URL=http://localhost:3000
   ```

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
   REACT_APP_MEDIA_SERVER_URL=http://localhost:3002
   
   # For production with domain (uncomment when deploying)
   # REACT_APP_API_URL=https://yourdomain.com
   # REACT_APP_MEDIA_SERVER_URL=https://media.yourdomain.com
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

#### Setting up the Media Relay Server
1. Navigate to the media-relay-server directory:
   ```
   cd GameSquawk/media-relay-server
   ```

2. Install dependencies:
   ```
   npm install --production
   ```

3. Create a `.env` file:
   ```
   PORT=3002
   CLIENT_URL=http://localhost:3000
   ```

4. Start the server:
   ```
   node server.js
   ```

### Production Deployment

#### Domain Configuration
1. Update your domain's DNS settings to point to your server IP
2. Configure Nginx for the main application:
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

3. Configure Nginx for the media relay server:
   ```
   server {
       server_name media.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
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

2. Obtain and configure SSL certificates:
   ```
   certbot --nginx -d yourdomain.com
   certbot --nginx -d media.yourdomain.com
   ```

3. Update frontend environment:
   ```
   # frontend/.env
   REACT_APP_API_URL=https://yourdomain.com
   REACT_APP_MEDIA_SERVER_URL=https://media.yourdomain.com
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

3. Start the media relay server:
   ```
   cd media-relay-server && pm2 start server.js --name "gamesquawk-media"
   ```

4. Serve the frontend build:
   ```
   cd frontend && pm2 start npm --name "gamesquawk-frontend" -- start
   ```

5. Configure PM2 to start on boot:
   ```
   pm2 startup
   pm2 save
   ```

## 📖 How to Use
1. **Register/Login**: Create an account or log in using email
2. **Create Posts**: Share your gaming experiences using the post form with markdown support
3. **Share Videos**: Upload and share your gameplay videos
4. **Interact**: Like posts and leave comments to engage with others
5. **Voice Chat**: Join voice chat rooms to discuss games in real-time
6. **Customize**: Switch between dark and light mode for comfortable viewing

## 🔧 Troubleshooting

### Missing Environment Variables
If you encounter authentication errors during startup:
1. Check if your backend `.env` file has all required variables
2. Make sure to install the `express-session` package: `npm install express-session`

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
1. Ensure your `.env` files have URLs set to use `https://` protocol
2. Rebuild the frontend application after making changes
3. Check browser console for specific error messages

### File Upload Issues
If profile images are not showing after upload:
1. Verify that the Nginx configuration includes the `/uploads` location block
2. Check the permissions on the `/backend/public/uploads` directory
3. Restart Nginx after making configuration changes

### Voice Chat Issues
If you experience problems with voice chat:
1. Check the media relay server logs: `pm2 logs gamesquawk-media`
2. Verify microphone permissions in your browser
3. Ensure the media server URL is correctly set in your frontend `.env` file
4. Check if your firewall allows WebSocket connections on port 3002

### Video Upload Issues
If you experience problems with video uploads:
1. Check if your video file is under the 100MB limit
2. Verify that the video format is supported (MP4, WebM)
3. Ensure you have proper Google Drive API credentials configured
4. Check the browser console for any upload-related errors

## 📱 Project Structure
```
GameSquawk/
├── frontend/          # React application
│   ├── src/          # Source code
│   │   ├── VideoUpload.js    # Video upload component
│   │   ├── VideoList.js      # Video browsing component
│   │   └── VideoDetail.js    # Video viewing component
│   ├── public/       # Static files
│   └── build/        # Production build
├── backend/          # Node.js server
│   ├── config/       # Database configuration
│   ├── controllers/  # Route controllers
│   │   └── videoController.js  # Video operations
│   ├── models/       # Database models
│   │   └── Video.js  # Video metadata model
│   ├── routes/       # API routes
│   │   └── videoRoutes.js  # Video endpoints
│   ├── services/     # Business logic
│   │   └── googleDriveService.js  # Google Drive integration
│   ├── middleware/   # Custom middleware
│   └── socket/       # Socket.io handlers
├── media-relay-server/  # Voice chat server
│   ├── server.js     # Main server file
│   └── deploy/       # Deployment scripts
└── presentation/     # Project presentation
    └── GameSquawk_Presentation.pptx
```

## 📚 Additional Documentation
- [Voice Chat Setup Guide](VOICE-CHAT-SETUP.md)
- [Developer Guide](DEVELOPER-GUIDE.md)
- [Video Feature Documentation](README-VideoFeature.md)
