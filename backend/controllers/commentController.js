const { Post, Comment } = require('../models/Post');
const User = require('../models/User');

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      content,
      userId: req.user.id,
      postId
    });

    // Fetch the complete comment with user information
    const completeComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        attributes: ['id', 'username']
      }]
    });

    // Emit socket event for real-time updates
    req.io.emit('commentAdded', {
      postId,
      comment: completeComment
    });

    res.status(201).json(completeComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.findAll({
      where: { postId },
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(comments);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const comment = await Comment.findOne({
      where: {
        id: commentId,
        postId
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.destroy();

    // Emit socket event for real-time updates
    req.io.emit('commentDeleted', {
      postId,
      commentId
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

module.exports = {
  addComment,
  getComments,
  deleteComment
}; 