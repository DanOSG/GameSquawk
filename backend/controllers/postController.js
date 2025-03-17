const { Post } = require('../models/Post');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const post = await Post.create({
      title,
      content,
      category,
      userId: req.user.id
    });
    
    // Fetch the complete post with user information
    const completePost = await Post.findByPk(post.id, {
      include: [{
        model: User,
        attributes: ['id', 'username']
      }]
    });

    // Emit the new post to all connected clients
    req.io.emit('newPost', completePost);
    
    res.status(201).json(completePost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const post = await Post.findByPk(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.userId === req.user.id) {
      await post.update({ title, content, category });

      // Fetch the updated post with user information
      const updatedPost = await Post.findByPk(id, {
        include: [{
          model: User,
          attributes: ['id', 'username']
        }]
      });

      // Emit the updated post to all clients
      req.io.emit('updatePost', updatedPost);
      
      res.json(updatedPost);
    } else {
      res.status(403).json({ message: 'Not authorized' });
    }
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (post && post.userId === req.user.id) {
      await post.destroy();
      // Emit delete event to all clients
      req.io.emit('deletePost', id);
      res.json({ message: 'Post deleted successfully' });
    } else {
      res.status(403).json({ message: 'Not authorized' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};
    const posts = await Post.findAll({
      where,
      include: [{
        model: User,
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(posts);
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ error: error.message });
  }
};