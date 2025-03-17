const express = require('express');
const { createPost, updatePost, deletePost, getPosts } = require('../controllers/postController');
const { handleLike, getLikeStatus } = require('../controllers/likeController');
const { addComment, getComments, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Post routes
router.post('/', authMiddleware, createPost);
router.get('/', authMiddleware, getPosts);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Like routes
router.post('/:postId/like', authMiddleware, handleLike);
router.get('/:postId/like', authMiddleware, getLikeStatus);

// Comment routes
router.post('/:postId/comments', authMiddleware, addComment);
router.get('/:postId/comments', authMiddleware, getComments);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;
