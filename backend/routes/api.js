const express = require('express');
const router = express.Router();
const { createPost, getPosts, updatePost, deletePost } = require('../controllers/postController');
const { handleLike, getLikeStatus } = require('../controllers/likeController');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Post routes
router.post('/posts', authMiddleware, createPost);
router.get('/posts', authMiddleware, getPosts);
router.put('/posts/:id', authMiddleware, updatePost);
router.delete('/posts/:id', authMiddleware, deletePost);

// Like routes
router.post('/posts/:postId/like', authMiddleware, handleLike);
router.get('/posts/:postId/like', authMiddleware, getLikeStatus);

// Comment routes
router.post('/posts/:postId/comments', authMiddleware, addComment);
router.get('/posts/:postId/comments', authMiddleware, getComments);
router.delete('/posts/:postId/comments/:commentId', authMiddleware, deleteComment);

module.exports = router; 