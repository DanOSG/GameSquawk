import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { FiEdit2, FiTrash2, FiSave, FiX, FiThumbsUp, FiThumbsDown, FiMessageSquare } from 'react-icons/fi';
import { BiCategory } from 'react-icons/bi';
import { FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  'Technology',
  'Lifestyle',
  'Travel',
  'Food',
  'Health'
];

const PostList = ({ token, onDeletePost }) => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [socket, setSocket] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [userAvatars, setUserAvatars] = useState({});

  // Move API calls to useCallback hooks
  const fetchLikeStatus = useCallback(async (postId) => {
    if (!token) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/posts/${postId}/like`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likes: response.data.likes, dislikes: response.data.dislikes }
            : post
        )
      );
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  }, [token]);

  const fetchComments = useCallback(async (postId) => {
    if (!token) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/posts/${postId}/comments`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setComments(prev => ({
        ...prev,
        [postId]: response.data
      }));

      // Fetch avatars for comment authors
      response.data.forEach(comment => {
        if (comment.userId && !userAvatars[comment.userId]) {
          fetchUserAvatar(comment.userId);
        }
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [token, userAvatars]);

  const fetchUserAvatar = useCallback(async (userId) => {
    if (!token || userAvatars[userId] !== undefined) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/api/users/${userId}/avatar`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.avatar) {
        setUserAvatars(prev => ({
          ...prev,
          [userId]: `${API_URL}${response.data.avatar}`
        }));
      } else {
        // Store null if no avatar was found to prevent retrying
        setUserAvatars(prev => ({
          ...prev,
          [userId]: null
        }));
      }
    } catch (error) {
      console.error(`Error fetching avatar for user ${userId}:`, error);
      // Set null on error to prevent continuous retries
      setUserAvatars(prev => ({
        ...prev,
        [userId]: null
      }));
    }
  }, [token, API_URL, userAvatars]);

  const fetchPosts = useCallback(async () => {
    if (!token) {
      console.log('No token available for fetchPosts');
      return;
    }
    try {
      console.log('Fetching posts with token:', token);
      const response = await axios.get(
        `${API_URL}/api/posts${selectedCategory ? `?category=${selectedCategory}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Posts response:', response.data);
      setPosts(response.data);

      // Fetch likes and comments for each post
      response.data.forEach(post => {
        fetchLikeStatus(post.id);
        fetchComments(post.id);
        
        // Fetch avatar for post author
        if (post.userId && !userAvatars[post.userId]) {
          fetchUserAvatar(post.userId);
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error.response || error);
      if (error.response?.status === 401) {
        console.log('Token might be invalid or expired');
      }
    }
  }, [token, selectedCategory, fetchLikeStatus, fetchComments, fetchUserAvatar, userAvatars]);

  // Update useEffect hooks with proper dependencies
  useEffect(() => {
    if (!token) {
      console.log('No token available in PostList');
      return;
    }
    console.log('Token in PostList:', token);
    try {
      const decoded = jwtDecode(token);
      console.log('Decoded token:', decoded);
      setCurrentUserId(decoded.userId);
    } catch (error) {
      console.error('Could not verify your identity:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, {
      auth: {
        token: `Bearer ${token}`
      }
    });
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [token]);

  useEffect(() => {
    if (socket) {
      // Show new posts as they come in
      socket.on('newPost', (post) => {
        if (!selectedCategory || post.category === selectedCategory) {
          setPosts(prevPosts => [post, ...prevPosts]);
        }
      });

      // Remove deleted posts
      socket.on('deletePost', (deletedPostId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
      });

      // Update edited posts
      socket.on('updatePost', (updatedPost) => {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          )
        );
      });

      socket.on('commentAdded', ({ postId, comment }) => {
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), comment]
        }));
      });

      socket.on('commentDeleted', ({ postId, commentId }) => {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.filter(comment => comment.id !== commentId) || []
        }));
      });

      // Clean up our listeners
      return () => {
        socket.off('newPost');
        socket.off('deletePost');
        socket.off('updatePost');
        socket.off('commentAdded');
        socket.off('commentDeleted');
      };
    }
  }, [socket, selectedCategory]);

  const handleLike = async (postId, type) => {
    try {
      await axios.post(
        `${API_URL}/api/posts/${postId}/like`,
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLikeStatus(postId);
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (postId) => {
    try {
      await axios.post(
        `${API_URL}/api/posts/${postId}/comments`,
        { content: newComment[postId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.delete(
        `${API_URL}/api/posts/${postId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments(postId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleEdit = (post) => {
    setEditingPost({
      ...post,
      isEditing: true
    });
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
  };

  const handleSaveEdit = async (post) => {
    try {
      await axios.put(
        `${API_URL}/api/posts/${post.id}`,
        {
          title: post.title,
          content: post.content,
          category: post.category
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const handleInputChange = (e, field) => {
    setEditingPost({
      ...editingPost,
      [field]: e.target.value
    });
  };

  const generateMarkdownPreview = (markdown) => {
    return Promise.resolve(
      <div className="mde-preview-content">
        <ReactMarkdown>{markdown || ''}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div>
      <div className="category-filter">
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-dropdown"
        >
          <option value="">All Posts</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className="posts-container">
        {posts.map((post) => (
          <div key={post.id} className="post">
            {editingPost && editingPost.id === post.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) => handleInputChange(e, 'title')}
                  className="edit-input"
                  placeholder="Post title"
                />
                <div className="markdown-editor">
                  <textarea
                    value={editingPost.content}
                    onChange={(e) => handleInputChange(e, 'content')}
                    className="edit-textarea"
                    placeholder="Write your post content here..."
                    rows={10}
                  />
                  <div className="markdown-preview">
                    <h3>Preview:</h3>
                    <div className="preview-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {editingPost.content || ''}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                <select
                  value={editingPost.category}
                  onChange={(e) => handleInputChange(e, 'category')}
                  className="category-dropdown"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="edit-controls">
                  <button onClick={() => handleSaveEdit(editingPost)} className="save-button">
                    <FiSave /> Save Changes
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-button">
                    <FiX /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2>{post.title}</h2>
                <div className="post-meta">
                  <p className="post-category">
                    <BiCategory /> {post.category}
                  </p>
                  <Link to={`/profile/${post.userId}`} className="post-author">
                    {userAvatars[post.userId] ? (
                      <img 
                        src={userAvatars[post.userId]} 
                        alt={post.User?.username} 
                        className="post-author-avatar" 
                      />
                    ) : (
                      <FaUser />
                    )} 
                    {post.User?.username || 'Unknown'}
                  </Link>
                </div>
                <div className="post-content markdown-content">
                  <ReactMarkdown>{post.content || ''}</ReactMarkdown>
                </div>
                <div className="post-interactions">
                  <button onClick={() => handleLike(post.id, 'like')} className="like-button">
                    <FiThumbsUp /> {post.likes || 0}
                  </button>
                  <button onClick={() => handleLike(post.id, 'dislike')} className="dislike-button">
                    <FiThumbsDown /> {post.dislikes || 0}
                  </button>
                  <button 
                    onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    className="comment-button"
                  >
                    <FiMessageSquare /> {comments[post.id]?.length || 0}
                  </button>
                </div>
                {showComments[post.id] && (
                  <div className="comments-section">
                    <div className="comment-form">
                      <textarea
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a comment..."
                      />
                      <button onClick={() => handleComment(post.id)}>Post Comment</button>
                    </div>
                    <div className="comments-list">
                      {comments[post.id]?.map(comment => (
                        <div key={comment.id} className="comment">
                          <p>{comment.content}</p>
                          <div className="comment-meta">
                            <Link to={`/profile/${comment.userId}`} className="comment-author">
                              {userAvatars[comment.userId] ? (
                                <img 
                                  src={userAvatars[comment.userId]} 
                                  alt={comment.User?.username} 
                                  className="comment-author-avatar" 
                                />
                              ) : (
                                <FaUser />
                              )}
                              <span>{comment.User?.username || 'Unknown'}</span>
                            </Link>
                            {currentUserId === comment.userId && (
                              <button 
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                className="delete-comment"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {currentUserId === post.userId && (
                  <div className="post-controls">
                    <button onClick={() => handleEdit(post)} className="edit-button">
                      <FiEdit2 /> Edit Post
                    </button>
                    <button onClick={() => onDeletePost(post.id)} className="delete-button">
                      <FiTrash2 /> Delete Post
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostList;