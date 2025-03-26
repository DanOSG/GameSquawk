# GameSquawk Video Upload Feature

## Overview
The video upload feature allows users to upload and share gameplay videos with the GameSquawk community. Videos are stored in Google Drive and can be viewed, liked, disliked, and commented on by other users.

## Features
- Upload gameplay videos directly from your device
- Automatic video hosting through Google Drive
- Video playback directly in the application
- Like and dislike videos
- Comment on videos
- View count tracking
- Browse videos uploaded by all users
- Delete your own videos

## Technical Implementation
- Frontend: React components for video upload, listing, and detailed view
- Backend: Express API with Google Drive integration
- Database: Video metadata and user interactions stored in SQL database
- Authentication: JWT-based authentication for secure video management

## How to Use
1. Navigate to the "Videos" section from the sidebar
2. Click "Upload Video" to share your gameplay
3. Fill in title and description, then select your video file
4. Click "Upload" and wait for the upload to complete
5. Your video will appear in the video list once processed

## Security
- Videos are stored securely in Google Drive
- Only the uploader can delete their own videos
- Authentication is required for uploading, liking, and commenting

## File Structure
- `frontend/src/VideoUpload.js` - Video upload component
- `frontend/src/VideoList.js` - Video browsing component
- `frontend/src/VideoDetail.js` - Video viewing component
- `backend/routes/videoRoutes.js` - API endpoints for video operations
- `backend/controllers/videoController.js` - Business logic for video operations
- `backend/models/Video.js` - Database model for video metadata
- `backend/services/googleDriveService.js` - Google Drive integration service

## Technical Notes
- Video uploads are limited to 100MB
- Supported formats include MP4, WebM, and other common video formats
- The Google Drive API is used for video storage and streaming
- Temporary files are cleaned up after successful upload 