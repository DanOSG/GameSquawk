import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiThumbsUp, FiThumbsDown, FiEye, FiCalendar, 
  FiUser, FiSend, FiTrash2, FiArrowLeft 
} from 'react-icons/fi';
import './VideoDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VideoDetail = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [userReaction, setUserReaction] = useState(null); // 'like', 'dislike', or null
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Extract user ID from token if available
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.userId);
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    fetchVideo();
  }, [id, token]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/videos/${id}`);
      setVideo(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error loading video. It may have been removed or is unavailable.');
      setLoading(false);
      console.error('Error fetching video:', err);
    }
  };

  const handleReaction = async (type) => {
    if (!token) {
      navigate('/login?redirect=' + encodeURIComponent(`/videos/${id}`));
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/videos/${id}/reactions`,
        { reaction: type },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setVideo(response.data.video);
      
      // Toggle user reaction
      if (userReaction === type) {
        setUserReaction(null); // Removed reaction
      } else {
        setUserReaction(type); // Added or changed reaction
      }
    } catch (err) {
      console.error('Error reacting to video:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!token) {
      navigate('/login?redirect=' + encodeURIComponent(`/videos/${id}`));
      return;
    }
    
    if (!commentText.trim()) return;
    
    try {
      setCommenting(true);
      const response = await axios.post(
        `${API_URL}/api/videos/${id}/comments`,
        { content: commentText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Add new comment to the list
      setVideo(prevVideo => ({
        ...prevVideo,
        comments: [...prevVideo.comments, response.data]
      }));
      
      setCommentText('');
      setCommenting(false);
    } catch (err) {
      console.error('Error posting comment:', err);
      setCommenting(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!token || !video || video.uploader.id !== userId) return;
    
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/api/videos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        navigate('/videos');
      } catch (err) {
        console.error('Error deleting video:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading video...</div>;
  }

  if (error || !video) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <Link to="/videos" className="back-link">
          <FiArrowLeft /> Back to Videos
        </Link>
      </div>
    );
  }

  return (
    <div className="video-detail-container">
      <div className="video-player-container">
        <div className="video-player">
          <iframe
            src={video.webViewLink}
            title={video.title}
            allowFullScreen
            allow="autoplay"
            className="video-iframe"
          ></iframe>
        </div>
      </div>
      
      <div className="video-info-container">
        <div className="video-header">
          <h1 className="video-title">{video.title}</h1>
          
          <div className="video-meta">
            <div className="video-stats">
              <div className="stat">
                <FiEye className="icon" />
                <span>{video.viewCount} views</span>
              </div>
              <div className="stat">
                <FiCalendar className="icon" />
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </div>
            
            <div className="video-actions">
              <button 
                className={`reaction-button ${userReaction === 'like' ? 'active' : ''}`}
                onClick={() => handleReaction('like')}
              >
                <FiThumbsUp className="icon" />
                <span>{video.likeCount}</span>
              </button>
              
              <button 
                className={`reaction-button ${userReaction === 'dislike' ? 'active' : ''}`}
                onClick={() => handleReaction('dislike')}
              >
                <FiThumbsDown className="icon" />
                <span>{video.dislikeCount}</span>
              </button>
              
              {userId && video.uploader.id === userId && (
                <button 
                  className="delete-button"
                  onClick={handleDeleteVideo}
                >
                  <FiTrash2 className="icon" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="video-uploader">
          <Link to={`/profile/${video.uploader.id}`} className="uploader-info">
            {video.uploader.avatar ? (
              <img
                src={`${API_URL}${video.uploader.avatar}`}
                alt={video.uploader.username}
                className="uploader-avatar"
              />
            ) : (
              <div className="uploader-placeholder">
                {video.uploader.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="uploader-name">{video.uploader.username}</span>
          </Link>
        </div>
        
        {video.description && (
          <div className="video-description">
            <p>{video.description}</p>
          </div>
        )}
        
        <div className="video-comments">
          <h3 className="comments-title">
            Comments ({video.comments ? video.comments.length : 0})
          </h3>
          
          {token ? (
            <form onSubmit={handleComment} className="comment-form">
              <div className="comment-input-container">
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows="2"
                  className="comment-input"
                  disabled={commenting}
                />
                <button 
                  type="submit" 
                  className="comment-submit"
                  disabled={commenting || !commentText.trim()}
                >
                  <FiSend />
                </button>
              </div>
            </form>
          ) : (
            <div className="login-to-comment">
              <Link to={`/login?redirect=${encodeURIComponent(`/videos/${id}`)}`}>
                Sign in to comment
              </Link>
            </div>
          )}
          
          <div className="comments-list">
            {video.comments && video.comments.length > 0 ? (
              video.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <Link to={`/profile/${comment.userId}`} className="comment-avatar">
                    {comment.User.avatar ? (
                      <img
                        src={`${API_URL}${comment.User.avatar}`}
                        alt={comment.User.username}
                      />
                    ) : (
                      <div className="comment-avatar-placeholder">
                        {comment.User.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  
                  <div className="comment-content">
                    <div className="comment-header">
                      <Link to={`/profile/${comment.userId}`} className="comment-username">
                        {comment.User.username}
                      </Link>
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-comments">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail; 