const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const User = require('../models/User');
const Comment = require('../models/Comment');
const googleDriveService = require('../services/googleDriveService');
const { Op } = require('sequelize');

// Upload a video
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, description } = req.body;
    const userId = req.user.id;
    
    // Check if title is provided
    if (!title) {
      return res.status(400).json({ message: 'Video title is required' });
    }

    // Upload to Google Drive
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    
    const uploadedFile = await googleDriveService.uploadVideo(
      filePath, 
      mimeType, 
      title, 
      description
    );

    // Create video record in database
    const video = await Video.create({
      title,
      description,
      userId,
      fileId: uploadedFile.id,
      webViewLink: uploadedFile.webViewLink,
      webContentLink: uploadedFile.webContentLink,
      thumbnailLink: uploadedFile.thumbnailLink,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size
    });

    // Clean up temporary file
    fs.unlinkSync(filePath);

    res.status(201).json({ 
      message: 'Video uploaded successfully',
      video
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
};

// Get all videos with pagination
exports.getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      videos,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({ message: 'Error getting videos', error: error.message });
  }
};

// Get a single video by ID
exports.getVideo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Comment,
          as: 'comments',
          include: {
            model: User,
            attributes: ['id', 'username', 'avatar']
          }
        }
      ]
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment view count
    video.viewCount += 1;
    await video.save();

    res.json(video);
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ message: 'Error getting video', error: error.message });
  }
};

// Like or dislike a video
exports.reactToVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body; // 'like' or 'dislike'
    const userId = req.user.id;

    if (!['like', 'dislike'].includes(reaction)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user already reacted to this video
    const VideoLike = Video.VideoLike;
    const existingReaction = await VideoLike.findOne({
      where: {
        videoId: id,
        userId
      }
    });

    const isLike = reaction === 'like';

    if (existingReaction) {
      // If reaction is the same, remove it (toggle off)
      if (existingReaction.isLike === isLike) {
        await existingReaction.destroy();
        
        // Update counts
        if (isLike) {
          video.likeCount = Math.max(0, video.likeCount - 1);
        } else {
          video.dislikeCount = Math.max(0, video.dislikeCount - 1);
        }
        
        await video.save();
        return res.json({ message: 'Reaction removed', video });
      } else {
        // Change reaction type
        existingReaction.isLike = isLike;
        await existingReaction.save();
        
        // Update counts
        if (isLike) {
          video.likeCount += 1;
          video.dislikeCount = Math.max(0, video.dislikeCount - 1);
        } else {
          video.dislikeCount += 1;
          video.likeCount = Math.max(0, video.likeCount - 1);
        }
        
        await video.save();
        return res.json({ message: 'Reaction updated', video });
      }
    } else {
      // Create new reaction
      await VideoLike.create({
        videoId: id,
        userId,
        isLike
      });
      
      // Update counts
      if (isLike) {
        video.likeCount += 1;
      } else {
        video.dislikeCount += 1;
      }
      
      await video.save();
      return res.json({ message: 'Reaction added', video });
    }
  } catch (error) {
    console.error('Error reacting to video:', error);
    res.status(500).json({ message: 'Error reacting to video', error: error.message });
  }
};

// Add a comment to a video
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const comment = await Comment.create({
      content,
      userId,
      videoId: id
    });

    // Include user data in response
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: {
        model: User,
        attributes: ['id', 'username', 'avatar']
      }
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Delete a video
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if user is the uploader
    if (video.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    // Delete from Google Drive
    await googleDriveService.deleteFile(video.fileId);

    // Delete from database
    await video.destroy();

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
}; 