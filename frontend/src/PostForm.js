import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMde from 'react-mde';
import "react-mde/lib/styles/css/react-mde-all.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY;

const PostForm = ({ token }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    gameId: '', 
    gameTitle: '', 
    gameImage: ''
  });
  const [selectedTab, setSelectedTab] = useState("write");
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Only search if there's an actual value
    if (value.trim()) {
      setIsSearching(true);
      
      // Debounce the API call to avoid too many requests
      debounceTimeout.current = setTimeout(() => {
        searchGames(value);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const searchGames = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`https://api.rawg.io/api/games`, {
        params: {
          key: RAWG_API_KEY,
          search: query,
          page_size: 8
        }
      });
      
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Error searching games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGame = (game) => {
    setFormData({
      ...formData,
      gameId: game.id.toString(),
      gameTitle: game.name,
      gameImage: game.background_image
    });
    
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const generateMarkdownPreview = (markdown) => {
    return Promise.resolve(
      <div className="mde-preview-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || ''}</ReactMarkdown>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Using API URL:', API_URL);
      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Clear form after successful submission
      setFormData({ 
        title: '', 
        content: '', 
        gameId: '', 
        gameTitle: '', 
        gameImage: '' 
      });
      setSelectedTab("write");
      window.location.reload(); // Refresh to show new post
    } catch (error) {
      alert('Post creation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <div className="form-group">
        <input 
          type="text" 
          name="title" 
          placeholder="Title" 
          value={formData.title}
          onChange={handleChange} 
          required
        />
      </div>
      <div className="form-group">
        <ReactMde
          value={formData.content}
          onChange={handleContentChange}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          generateMarkdownPreview={generateMarkdownPreview}
        />
      </div>
      <div className="form-group game-search-container">
        <input
          type="text"
          className="form-control"
          placeholder="Search for a game to categorize your post..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        
        {isSearching && (
          <div className="search-results">
            {isLoading ? (
              <div className="text-center p-3">Loading...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(game => (
                <div 
                  key={game.id} 
                  className="search-result-item"
                  onClick={() => handleSelectGame(game)}
                >
                  {game.background_image && (
                    <img 
                      src={game.background_image} 
                      alt={game.name}
                      className="game-result-image"
                    />
                  )}
                  <div>
                    <div className="game-result-title">{game.name || 'Unknown Game'}</div>
                    <div className="game-result-platform">
                      {game.platforms?.map(p => p.platform.name).join(', ') || 'Unknown Platform'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-3">No games found</div>
            )}
          </div>
        )}
        
        {formData.gameTitle && (
          <div className="selected-game">
            <div className="selected-game-info">
              {formData.gameImage && (
                <img 
                  src={formData.gameImage} 
                  alt={formData.gameTitle}
                  className="selected-game-image"
                />
              )}
              <div>
                <div className="selected-game-title">{formData.gameTitle}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <button type="submit" className="submit-button" disabled={!formData.gameId || !formData.title || !formData.content}>
        Create Post
      </button>
    </form>
  );
};

export default PostForm;
