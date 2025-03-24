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
- **User Profiles**: View public profiles of other users
- **Avatar Support**: Upload and display profile pictures
- **Responsive Design**: Works on desktop and mobile devices
- **HTTPS Support**: Secure connection with SSL/TLS
- **Domain Configuration**: Custom domain support

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

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- MySQL database
- npm or yarn package manager
- (Optional) Nginx for production deployment
- (Optional) Domain name for production deployment

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
   PORT=3001
   DB_HOST=localhost
   DB_USER=your_database_username
   DB_PASSWORD=your_database_password
   DB_NAME=database_db
   JWT_SECRET=your_jwt_secret
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
   npm install
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

## 📖 How to Use
1. **Register/Login**: Create an account or log in to access features
2. **Create Posts**: Share your gaming experiences using the post form
3. **Interact**: Like posts and leave comments to engage with others
4. **View Profiles**: Click on a username or avatar to view that user's profile
5. **Customize Profile**: Upload an avatar and update your profile information
6. **Customize**: Switch between dark and light mode for comfortable viewing

## 🔧 Troubleshooting

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
