const User = require('../models/User');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio, favoriteGames, gamingStats } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (bio !== undefined) user.bio = bio;
    if (favoriteGames) {
      try {
        user.favoriteGames = typeof favoriteGames === 'string' 
          ? JSON.parse(favoriteGames) 
          : favoriteGames;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid favoriteGames format' });
      }
    }
    if (gamingStats) {
      try {
        user.gamingStats = typeof gamingStats === 'string' 
          ? JSON.parse(gamingStats) 
          : gamingStats;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid gamingStats format' });
      }
    }
    
    await user.save();
    res.json({ 
      message: 'Profile updated successfully',
      user: { ...user.toJSON(), password: undefined }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old avatar if it exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../public', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();
    
    res.json({ 
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Error updating avatar' });
  }
};

exports.linkGamingAccount = async (req, res) => {
  try {
    const { provider, accountId } = req.body;
    
    if (!provider || !accountId) {
      return res.status(400).json({ message: 'Provider and accountId are required' });
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    switch (provider) {
      case 'steam':
        user.steamId = accountId;
        break;
      case 'xbox':
        user.xboxId = accountId;
        break;
      case 'psn':
        user.psnId = accountId;
        break;
      case 'discord':
        user.discordId = accountId;
        break;
      default:
        return res.status(400).json({ message: 'Invalid provider' });
    }
    
    await user.save();
    res.json({ message: `${provider} account linked successfully` });
  } catch (error) {
    console.error('Error linking gaming account:', error);
    res.status(500).json({ message: 'Error linking gaming account' });
  }
};

exports.getUserAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['avatar']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    res.status(500).json({ message: 'Error fetching user avatar' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'avatar', 'bio', 'favoriteGames', 'gamingStats']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
}; 