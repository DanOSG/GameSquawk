import React, { useState, useEffect } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import jwt_decode from 'jwt-decode';

const Comments = ({ postId, token, socket }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (token) {
      const decoded = jwt_decode(token);
      setUserId(decoded.id);
    }
  }, [token]);

  useEffect(() => {
    fetchComments();

    if (socket) {
      socket.on('commentAdded', ({ postId: updatedPostId, comment }) => {
        if (postId === updatedPostId) {
          setComments(prev => [...prev, comment]);
        }
      });

      socket.on('commentDeleted', ({ postId: updatedPostId, commentId }) => {
        if (postId === updatedPostId) {
          setComments(prev => prev.filter(comment => comment._id !== commentId));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('commentAdded');
        socket.off('commentDeleted');
      }
    };
  }, [postId, socket]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="comments-section">
      <h3>Comments</h3>
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="comment-input"
        />
        <button type="submit" className="comment-submit">
          <FiSend />
        </button>
      </form>
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment._id} className="comment">
            <div className="comment-header">
              <span className="comment-author">{comment.authorName}</span>
              <span className="comment-date">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="comment-content">{comment.content}</p>
            {userId === comment.author && (
              <button
                onClick={() => handleDelete(comment._id)}
                className="delete-comment"
                aria-label="Delete comment"
              >
                <FiTrash2 />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments; 