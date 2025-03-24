import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PublicProfile = ({ token }) => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/users/${userId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile.');
        setLoading(false);
      }
    };

    if (token && userId) {
      fetchUserProfile();
    }
  }, [token, userId]);

  if (loading) {
    return <div className="content-section">Loading profile...</div>;
  }

  if (error) {
    return <div className="content-section">
      <div className="alert error">{error}</div>
    </div>;
  }

  if (!profile) {
    return <div className="content-section">
      <div className="alert error">User not found</div>
    </div>;
  }

  return (
    <div className="content-section">
      <h2 className="section-title">{profile.username}'s Profile</h2>
      
      <div className="card">
        <div className="card-body">
          <div className="profile-header">
            <div className="avatar-container">
              <img 
                src={profile.avatar ? `${API_URL}${profile.avatar}` : 'https://via.placeholder.com/150'} 
                alt={profile.username} 
                className="profile-avatar" 
              />
            </div>
            <div className="profile-info">
              <h3>{profile.username}</h3>
              <p className="text-subdued">{profile.email}</p>
            </div>
          </div>
          
          {profile.bio && (
            <div className="profile-section">
              <h4>Bio</h4>
              <p>{profile.bio}</p>
            </div>
          )}
          
          {profile.favoriteGames && profile.favoriteGames.length > 0 && (
            <div className="profile-section">
              <h4>Favorite Games</h4>
              <div className="games-list">
                {profile.favoriteGames.map((game, index) => (
                  <div key={index} className="game-item">
                    <div className="game-content">
                      <div>
                        <strong>{game.title}</strong>
                        {game.platform && <span className="platform-tag">{game.platform}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {profile.gamingStats && (
            <div className="profile-section">
              <h4>Gaming Stats</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Games Played</span>
                  <span className="stat-value">{profile.gamingStats.gamesPlayed || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Play Time</span>
                  <span className="stat-value">{profile.gamingStats.totalPlayTime || 0} hours</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Achievements</span>
                  <span className="stat-value">{profile.gamingStats.achievements || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile; 