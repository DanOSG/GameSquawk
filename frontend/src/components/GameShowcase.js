import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../App.css';

const GameShowcase = ({ games, onGamesChange, isEditing, isDarkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const debounceTimeout = useRef(null);

  const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY;

  useEffect(() => {
    if (games && games.length > 0) {
      // Automatically start carousel rotation if there are games
      const interval = setInterval(() => {
        setActiveIndex(prevIndex => (prevIndex + 1) % games.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [games]);

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
    // Create a game object with the data we want to store
    const selectedGame = {
      id: game.id || 0,
      title: game.name || 'Unknown Game',
      platform: game.platforms?.map(p => p.platform.name).join(', ') || 'Unknown Platform',
      background_image: game.background_image || null,
      rating: game.rating || null
    };
    
    // Add the selected game to the list of favorite games
    const updatedGames = [...(games || []), selectedGame];
    onGamesChange(updatedGames);
    
    // Clear search
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleRemoveGame = (index) => {
    const updatedGames = games.filter((_, i) => i !== index);
    onGamesChange(updatedGames);
    
    // Update active index if necessary
    if (activeIndex >= updatedGames.length && updatedGames.length > 0) {
      setActiveIndex(updatedGames.length - 1);
    }
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="game-showcase">
      {isEditing && (
        <div className="game-search-container" style={{ 
          backgroundColor: isDarkMode ? 'var(--card)' : 'var(--input-bg)',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '15px'
        }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search for games..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ 
              backgroundColor: isDarkMode ? 'var(--card)' : 'var(--input-bg)', 
              color: 'var(--text)'
            }}
          />
          
          {isSearching && (
            <div className="search-results" style={{
              backgroundColor: isDarkMode ? 'var(--card)' : 'white',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {isLoading ? (
                <div className="text-center p-3">Loading...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(game => (
                  <div 
                    key={game.id} 
                    className="search-result-item"
                    onClick={() => handleSelectGame(game)}
                    style={{
                      display: 'flex',
                      padding: '8px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      alignItems: 'center'
                    }}
                  >
                    {game.background_image && (
                      <img 
                        src={game.background_image} 
                        alt={game.name}
                        style={{
                          width: '60px',
                          height: '40px',
                          objectFit: 'cover',
                          marginRight: '10px',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{game.name || 'Unknown Game'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-subdued)' }}>
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
        </div>
      )}

      {games && games.length > 0 ? (
        <div className="game-carousel-container">
          <div 
            className="game-carousel" 
            ref={carouselRef}
            style={{
              position: 'relative',
              height: '250px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }}
          >
            {games.map((game, index) => (
              <div 
                key={index}
                className={`carousel-slide ${index === activeIndex ? 'active' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: index === activeIndex ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                  backgroundImage: game.background_image ? `url(${game.background_image})` : 'linear-gradient(45deg, #1e293b, #334155)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div 
                  className="game-info"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '15px',
                    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <h3 style={{ margin: '0 0 5px 0' }}>{game.title || 'Unknown Game'}</h3>
                  <p style={{ margin: '0', fontSize: '0.9rem' }}>{game.platform || 'Unknown Platform'}</p>
                  {game.rating && (
                    <div className="rating" style={{ 
                      marginTop: '5px',
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: 'rgba(255, 204, 0, 0.8)',
                      borderRadius: '4px',
                      color: 'black',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      ★ {game.rating.toFixed(1)}
                    </div>
                  )}
                  
                  {isEditing && (
                    <button 
                      className="remove-game-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGame(index);
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <div 
              className="carousel-controls"
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {games.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: index === activeIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-games-message" style={{ 
          textAlign: 'center', 
          padding: '20px',
          backgroundColor: isDarkMode ? 'var(--card)' : 'var(--light-bg)',
          borderRadius: '8px'
        }}>
          {isEditing ? (
            <p>Search and add your favorite games to showcase on your profile.</p>
          ) : (
            <p>No favorite games added yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GameShowcase; 