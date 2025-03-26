const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const videoController = require('../controllers/videoController');

// Set up multer storage for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only video files
const fileFilter = (req, file, cb) => {
  // Accept only video file types
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

// Configure multer for video uploads
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  }
});

// Routes
// Get all videos (public)
router.get('/', videoController.getVideos);

// Get a single video (public)
router.get('/:id', videoController.getVideo);

// Protected routes below require authentication
// Upload a video
router.post('/', auth, upload.single('video'), videoController.uploadVideo);

// Add a comment to a video
router.post('/:id/comments', auth, videoController.addComment);

// Like or dislike a video
router.post('/:id/reactions', auth, videoController.reactToVideo);

// Delete a video
router.delete('/:id', auth, videoController.deleteVideo);

module.exports = router; 