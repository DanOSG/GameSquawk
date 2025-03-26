const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./User');

// Define models
const Post = sequelize.define('Post', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  gameId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gameTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gameImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

const Like = sequelize.define('Like', {
  type: {
    type: DataTypes.ENUM('like', 'dislike'),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Define associations after all models are created
const setupAssociations = () => {
  User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Post.belongsTo(User, { foreignKey: 'userId' });

  User.hasMany(Like, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Like.belongsTo(User, { foreignKey: 'userId' });
  Post.hasMany(Like, { foreignKey: 'postId', onDelete: 'CASCADE' });
  Like.belongsTo(Post, { foreignKey: 'postId' });

  User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Comment.belongsTo(User, { foreignKey: 'userId' });
  Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
  Comment.belongsTo(Post, { foreignKey: 'postId' });
};

// Export models and setup function
module.exports = { Post, Like, Comment, setupAssociations };