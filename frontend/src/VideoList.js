import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiThumbsUp, FiThumbsDown, FiCalendar } from 'react-icons/fi';
import './VideoList.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VideoList = ({ token }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVideos = async (pageNum = 1, search = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/videos`, {
        params: {
          page: pageNum,
          limit: 8,
          search
        }
      });

      if (pageNum === 1) {
        setVideos(response.data.videos);
      } else {
        setVideos(prevVideos => [...prevVideos, ...response.data.videos]);
      }

      setHasMore(response.data.pagination.hasMore);
      setLoading(false);
    } catch (err) {
      setError('Failed to load videos. Please try again later.');
      setLoading(false);
      console.error('Error fetching videos:', err);
    }
  };

  useEffect(() => {
    fetchVideos(1, searchTerm);
  }, [searchTerm]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, searchTerm);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVideos(1, searchTerm);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="videos-container">
      <h2>Videos</h2>
      
      <div className="video-search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {token && (
        <div className="upload-button-container">
          <Link to="/videos/upload" className="upload-video-button">
            Upload Video
          </Link>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="video-grid">
        {videos.length === 0 && !loading ? (
          <div className="no-videos-message">
            No videos found. {token ? 'Be the first to upload a video!' : 'Please check back later.'}
          </div>
        ) : (
          videos.map(video => (
            <div key={video.id} className="video-card">
              <Link to={`/videos/${video.id}`}>
                <div className="video-thumbnail">
                  {video.thumbnailLink ? (
                    <img src={video.thumbnailLink} alt={video.title} />
                  ) : (
                    <div className="placeholder-thumbnail">
                      <span>{video.title.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="video-duration">
                    <FiCalendar className="icon" />
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  <div className="video-meta">
                    <div className="video-uploader">
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
                      <span>{video.uploader.username}</span>
                    </div>
                    <div className="video-stats">
                      <div className="stat">
                        <FiEye className="icon" />
                        <span>{formatViewCount(video.viewCount)}</span>
                      </div>
                      <div className="stat">
                        <FiThumbsUp className="icon" />
                        <span>{video.likeCount}</span>
                      </div>
                      <div className="stat">
                        <FiThumbsDown className="icon" />
                        <span>{video.dislikeCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {loading && <div className="loading-spinner">Loading...</div>}

      {hasMore && videos.length > 0 && (
        <div className="load-more-container">
          <button onClick={handleLoadMore} disabled={loading} className="load-more-button">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoList; 