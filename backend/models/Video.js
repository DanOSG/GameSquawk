const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./User');
const Comment = require('./Comment');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  webViewLink: {
    type: DataTypes.STRING,
    allowNull: false
  },
  webContentLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnailLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dislikeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// Define associations
const setupAssociations = () => {
  // Video belongs to a User (uploader)
  Video.belongsTo(User, {
    foreignKey: 'userId',
    as: 'uploader'
  });

  // Video has many Comments
  Video.hasMany(Comment, {
    foreignKey: 'videoId',
    as: 'comments',
    onDelete: 'CASCADE'
  });

  // Create VideoLike model for tracking likes and dislikes
  const VideoLike = sequelize.define('VideoLike', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    isLike: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true // true for like, false for dislike
    }
  });

  // Association for VideoLike
  Video.hasMany(VideoLike, {
    foreignKey: 'videoId',
    as: 'reactions',
    onDelete: 'CASCADE'
  });

  User.hasMany(VideoLike, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });

  VideoLike.belongsTo(Video);
  VideoLike.belongsTo(User);

  // Make VideoLike available
  Video.VideoLike = VideoLike;
};

module.exports = Video;
module.exports.setupAssociations = setupAssociations; 