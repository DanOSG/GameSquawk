const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  favoriteGames: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  gamingStats: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      gamesPlayed: 0,
      totalPlayTime: 0,
      achievements: 0
    }
  },
  steamId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  xboxId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  psnId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discordId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = User;
