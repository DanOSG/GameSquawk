const { Post, Like } = require('../models/Post');
const jwt = require('jsonwebtoken');

const handleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.body; // 'like' or 'dislike'
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Remove any existing like/dislike from this user
    await Like.destroy({
      where: {
        postId,
        userId
      }
    });

    // Add new like/dislike if type is provided
    if (type) {
      await Like.create({
        type,
        postId,
        userId
      });
    }

    // Get updated counts
    const likes = await Like.count({
      where: {
        postId,
        type: 'like'
      }
    });

    const dislikes = await Like.count({
      where: {
        postId,
        type: 'dislike'
      }
    });

    // Get user's current like status
    const userLike = await Like.findOne({
      where: {
        postId,
        userId
      }
    });

    // Emit socket event for real-time updates
    req.io.emit('postUpdated', {
      postId,
      likes,
      dislikes
    });

    res.json({
      likes,
      dislikes,
      userLiked: userLike?.type === 'like',
      userDisliked: userLike?.type === 'dislike'
    });
  } catch (error) {
    console.error('Error handling like/dislike:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

const getLikeStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const likes = await Like.count({
      where: {
        postId,
        type: 'like'
      }
    });

    const dislikes = await Like.count({
      where: {
        postId,
        type: 'dislike'
      }
    });

    const userLike = await Like.findOne({
      where: {
        postId,
        userId
      }
    });

    res.json({
      likes,
      dislikes,
      userLiked: userLike?.type === 'like',
      userDisliked: userLike?.type === 'dislike'
    });
  } catch (error) {
    console.error('Error getting like status:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

module.exports = {
  handleLike,
  getLikeStatus
}; 