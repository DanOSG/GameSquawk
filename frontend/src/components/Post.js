import React, { useState, useEffect } from 'react';
import { FiThumbsUp, FiThumbsDown, FiMessageSquare, FiEdit2, FiTrash2, FiEye, FiEdit } from 'react-icons/fi';
import Comments from './Comments';
import jwt_decode from 'jwt-decode';
import ReactMde from 'react-mde';
import "react-mde/lib/styles/css/react-mde-all.css";

const Post = ({ post, onDelete, token, socket }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [content, setContent] = useState(post.content);
  const [selectedTab, setSelectedTab] = useState("write");
  const [editedTitle, setEditedTitle] = useState(post.title);
  const [editedCategory, setEditedCategory] = useState(post.category);

  const options = {
    overrides: {
      h1: {
        props: {
          className: 'text-2xl font-bold mb-4 text-[var(--text)]'
        }
      },
      h2: {
        props: {
          className: 'text-xl font-bold mb-3 text-[var(--text)]'
        }
      },
      h3: {
        props: {
          className: 'text-lg font-bold mb-2 text-[var(--text)]'
        }
      },
      p: {
        props: {
          className: 'mb-4 text-[var(--text)]'
        }
      },
      a: {
        props: {
          className: 'text-[var(--primary)] hover:underline',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      },
      code: {
        props: {
          className: 'bg-[var(--background)] px-1 py-0.5 rounded text-[var(--text)] font-mono'
        }
      },
      pre: {
        props: {
          className: 'bg-[var(--background)] p-4 rounded-lg mb-4 overflow-x-auto'
        }
      },
      ul: {
        props: {
          className: 'list-disc list-inside mb-4 text-[var(--text)]'
        }
      },
      ol: {
        props: {
          className: 'list-decimal list-inside mb-4 text-[var(--text)]'
        }
      },
      blockquote: {
        props: {
          className: 'border-l-4 border-[var(--primary)] pl-4 italic mb-4 text-[var(--text-secondary)]'
        }
      }
    }
  };

  useEffect(() => {
    if (post?.content) {
      setContent(post.content);
      setEditedContent(post.content);
    }
  }, [post?.content]);

  useEffect(() => {
    if (token) {
      const decoded = jwt_decode(token);
      setUserId(decoded.id);
    }
  }, [token]);

  useEffect(() => {
    fetchLikeStatus();

    if (socket) {
      socket.on('postUpdated', ({ postId, likes, dislikes, content: newContent }) => {
        if (postId === post._id) {
          updateLikeStatus(likes, dislikes);
          if (newContent) {
            setContent(newContent);
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('postUpdated');
      }
    };
  }, [post._id, socket]);

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${post._id}/like`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      updateLikeStatus(data.likes, data.dislikes);
      setUserLiked(data.userLiked);
      setUserDisliked(data.userDisliked);
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const updateLikeStatus = (newLikes, newDislikes) => {
    setLikes(newLikes);
    setDislikes(newDislikes);
  };

  const handleLike = async (type) => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      const data = await response.json();
      updateLikeStatus(data.likes, data.dislikes);
      setUserLiked(data.userLiked);
      setUserDisliked(data.userDisliked);
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleEdit = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editedContent })
      });

      if (response.ok) {
        setContent(editedContent);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleSave = () => {
    onEdit(post.id, {
      title: editedTitle,
      content: editedContent,
      category: editedCategory
    });
    setIsEditing(false);
  };

  return (
    <div className="post">
      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="edit-title"
          />
          <select
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value)}
            className="category-dropdown"
          >
            <option value="Technology">Technology</option>
            <option value="Travel">Travel</option>
            <option value="Food">Food</option>
            <option value="Lifestyle">Lifestyle</option>
          </select>
          <ReactMde
            value={editedContent}
            onChange={setEditedContent}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            generateMarkdownPreview={(markdown) =>
              Promise.resolve(<div className="mde-preview-content">{markdown}</div>)
            }
          />
          <div className="button-group">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <h2>{post.title}</h2>
          <div className="post-meta">
            <span className="post-category">
              <FiMessageSquare /> {post.category}
            </span>
            <span className="post-author">
              By {post.authorName}
            </span>
          </div>
          <div className="post-content">
            <ReactMde
              value={content}
              selectedTab="preview"
              onTabChange={() => {}}
              generateMarkdownPreview={(markdown) =>
                Promise.resolve(<div className="mde-preview-content">{markdown}</div>)
              }
              readOnly={true}
              toolbarCommands={[]}
            />
          </div>
          <div className="post-actions">
            <div className="post-reactions">
              <button
                className={`reaction-button ${userLiked ? 'active' : ''}`}
                onClick={() => handleLike('like')}
              >
                <FiThumbsUp /> {likes}
              </button>
              <button
                className={`reaction-button ${userDisliked ? 'active' : ''}`}
                onClick={() => handleLike('dislike')}
              >
                <FiThumbsDown /> {dislikes}
              </button>
              <button
                className="comment-toggle"
                onClick={() => setShowComments(!showComments)}
              >
                <FiMessageSquare /> Comments
              </button>
            </div>
            {userId === post.author && (
              <div className="post-controls">
                <button onClick={() => setIsEditing(true)} className="edit-button">
                  <FiEdit2 /> Edit
                </button>
                <button onClick={() => onDelete(post._id)} className="delete-button">
                  <FiTrash2 /> Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {showComments && (
        <Comments postId={post._id} token={token} socket={socket} />
      )}
    </div>
  );
};

export default Post; 