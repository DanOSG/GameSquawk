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

## 🔧 Technology Stack
### Frontend
- React.js
- CSS for styling
- Socket.io client for real-time features
- Markdown rendering for rich content

### Backend
- Node.js with Express
- MySQL database with Sequelize ORM
- Socket.io for real-time communication
- JWT for authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or later)
- MySQL database
- npm or yarn package manager

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
   REACT_APP_API_URL=http://localhost:3001
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and visit:
   ```
   http://localhost:3000
   ```

## 📖 How to Use
1. **Register/Login**: Create an account or log in to access features
2. **Create Posts**: Share your gaming experiences using the post form
3. **Interact**: Like posts and leave comments to engage with others
4. **Customize**: Switch between dark and light mode for comfortable viewing

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

Common errors you might see:
```
Error in ./src/PostForm.js
Module not found: Can't resolve 'react-mde'
```
or
```
Error in ./src/PostForm.js
Module not found: Can't resolve 'react-mde/lib/styles/css/react-mde-all.css'
```

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
