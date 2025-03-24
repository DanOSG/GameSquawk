const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/avatars'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update profile
router.put('/profile', auth, userController.updateProfile);

// Upload avatar
router.put('/avatar', auth, upload.single('avatar'), userController.updateAvatar);

// Link gaming account
router.post('/link-account', auth, userController.linkGamingAccount);

// Add this route to get a user's avatar by ID
router.get('/:userId/avatar', auth, userController.getUserAvatar);

// Add this route to get a user's public profile
router.get('/:userId/profile', auth, userController.getPublicProfile);

module.exports = router; 