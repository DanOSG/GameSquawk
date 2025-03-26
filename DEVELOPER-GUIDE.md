# GameSquawk Developer Guide

## Project Overview
GameSquawk is a social platform for gamers to share posts, gameplay videos, and interact with other gaming enthusiasts. The application is built using a React frontend and Express backend with a SQL database.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- SQL database (MySQL or PostgreSQL)
- Google Cloud Platform account with Drive API enabled

### Installation
1. Clone the repository
   ```
   git clone https://github.com/yourusername/GameSquawk.git
   cd GameSquawk
   ```

2. Install dependencies
   ```
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the backend directory with the following variables:
     ```
     PORT=3001
     DB_HOST=localhost
     DB_USER=yourusername
     DB_PASSWORD=yourpassword
     DB_NAME=gamesquawk
     JWT_SECRET=your_jwt_secret
     CLIENT_URL=http://localhost:3000
     ```

4. Set up Google Drive API
   - Create a project in Google Cloud Platform
   - Enable the Google Drive API
   - Create service account credentials
   - Place the credentials JSON file at `backend/config/google-drive-credentials.json`

### Starting the Development Server
```
# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory)
npm start
```

## Architecture

### Frontend
- React-based single-page application
- React Router for routing
- CSS for styling (custom styling, no frameworks)
- Key components:
  - Post components (PostList, PostForm)
  - Video components (VideoList, VideoUpload, VideoDetail)
  - User components (Profile, PublicProfile)
  - Authentication components (Login, Register)

### Backend
- Express.js-based REST API
- Sequelize ORM for database interactions
- JWT authentication
- Socket.io for real-time features
- Key modules:
  - Models: User, Post, Comment, Video
  - Controllers: Handle business logic
  - Routes: Define API endpoints
  - Services: External integrations (Google Drive)

## Database Schema
The application uses the following main database models:
- User: Stores user account information
- Post: Stores text posts
- Comment: Stores comments on posts and videos
- Video: Stores video metadata
- Like: Stores likes/dislikes for posts and videos

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/logout` - Logout a user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get a specific post
- `DELETE /api/posts/:id` - Delete a post
- `POST /api/posts/:id/comments` - Add a comment to a post
- `POST /api/posts/:id/like` - Like/dislike a post

### Videos
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Upload a new video
- `GET /api/videos/:id` - Get a specific video
- `DELETE /api/videos/:id` - Delete a video
- `POST /api/videos/:id/comments` - Add a comment to a video
- `POST /api/videos/:id/reactions` - Like/dislike a video

### Users
- `GET /api/users/profile` - Get the current user's profile
- `PUT /api/users/profile` - Update the current user's profile
- `GET /api/users/:id` - Get a specific user's profile

## Adding New Features
When adding new features to GameSquawk, follow these guidelines:

1. **Follow the existing architectural patterns**
   - For new entity types, create models, controllers, and routes
   - Reuse existing components and styling patterns

2. **Maintain consistent coding style**
   - Follow the project's naming conventions
   - Maintain the existing folder structure

3. **Handle errors consistently**
   - Validate inputs on both client and server
   - Return appropriate HTTP status codes
   - Provide meaningful error messages

4. **Write tests**
   - Add unit tests for new components and API endpoints
   - Test error handling and edge cases

5. **Document your changes**
   - Update this guide with any architectural changes
   - Add comments for complex logic
   - Create specific README files for major new features 