const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./User');

const VideoComment = sequelize.define('VideoComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  videoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Define associations
const setupAssociations = () => {
  VideoComment.belongsTo(User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });
};

module.exports = VideoComment;
module.exports.setupAssociations = setupAssociations; 