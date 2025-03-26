import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import GameShowcase from './components/GameShowcase';
import { FaCamera, FaUserCircle } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Profile = ({ token, username, isDarkMode, onAvatarUpdate }) => {
  const [profile, setProfile] = useState({
    username: username || '',
    email: '',
    avatar: '',
    bio: '',
    favoriteGames: [],
    gamingStats: {
      gamesPlayed: 0,
      totalPlayTime: 0,
      achievements: 0
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile information.');
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleBioChange = (e) => {
    setProfile({ ...profile, bio: e.target.value });
  };

  const handleGameChange = (updatedGames) => {
    setProfile({ ...profile, favoriteGames: updatedGames });
  };

  const handleStatsChange = (stat, value) => {
    setProfile({
      ...profile,
      gamingStats: { ...profile.gamingStats, [stat]: value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      // Update profile information
      await axios.put(`${API_URL}/api/users/profile`, {
        bio: profile.bio,
        favoriteGames: profile.favoriteGames,
        gamingStats: profile.gamingStats
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If avatar was changed, upload it
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        console.log('Uploading avatar to:', `${API_URL}/api/users/avatar`);
        const avatarResponse = await axios.put(`${API_URL}/api/users/avatar`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Avatar upload response:', avatarResponse.data);
        
        // Clear the file and preview after upload
        setAvatarFile(null);
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
        
        // Call the parent component's callback to update the avatar in the header
        if (onAvatarUpdate) {
          onAvatarUpdate();
        }
      }

      setMessage('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      setError('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return <div className="content-section">Loading profile...</div>;
  }

  const darkModeStyles = isDarkMode ? {
    card: {
      backgroundColor: '#1e293b !important',
      color: 'white !important'
    },
    cardBody: {
      backgroundColor: '#1e293b !important',
      color: 'white !important'
    }
  } : {};

  return (
    <div className="content-section">
      <h2 className="section-title">My Profile</h2>
      
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      
      <div 
        className="card" 
        style={{
          ...darkModeStyles.card,
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff'
        }}
      >
        <div 
          className="card-body"
          style={{
            ...darkModeStyles.cardBody
          }}
        >
          <div className="profile-header">
            <div className="avatar-container">
              <img 
                src={avatarPreview || (profile.avatar ? `${API_URL}${profile.avatar}` : 'https://via.placeholder.com/150')} 
                alt="Profile Avatar" 
                className="profile-avatar" 
                style={{ border: `3px solid var(--primary)` }}
              />
              {isEditing && (
                <div className="avatar-edit">
                  <label 
                    htmlFor="avatar-upload" 
                    className="avatar-edit-btn" 
                    style={{ 
                      background: 'var(--primary)',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s ease',
                    }}
                    title="Change profile picture"
                  >
                    <FaCamera />
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange} 
                  />
                </div>
              )}
            </div>
            <div className="profile-info">
              <h3>{profile.username}</h3>
              <p className="text-subdued">{profile.email}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea 
                id="bio" 
                className="form-control" 
                rows="3" 
                value={profile.bio || ''} 
                onChange={handleBioChange}
                disabled={!isEditing}
                style={{ 
                  backgroundColor: isDarkMode ? 'var(--card)' : 'var(--input-bg)', 
                  color: 'var(--text)'
                }}
              ></textarea>
            </div>
            
            <div className="form-group">
              <div className="games-header">
                <label className="form-label">Favorite Games</label>
              </div>
              
              <GameShowcase 
                games={profile.favoriteGames || []} 
                onGamesChange={handleGameChange} 
                isEditing={isEditing}
                isDarkMode={isDarkMode}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gaming Stats</label>
              <div className="stats-grid">
                <div className="stat-item">
                  <label className="stat-label">Games Played</label>
                  <input
                    type="number"
                    className="form-control"
                    value={profile.gamingStats?.gamesPlayed || 0}
                    onChange={(e) => handleStatsChange('gamesPlayed', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    min="0"
                    style={{ 
                      backgroundColor: isDarkMode ? 'var(--card)' : 'var(--input-bg)', 
                      color: 'var(--text)'
                    }}
                  />
                </div>
                <div className="stat-item">
                  <label className="stat-label">Total Play Time (hours)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={profile.gamingStats?.totalPlayTime || 0}
                    onChange={(e) => handleStatsChange('totalPlayTime', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    min="0"
                    style={{ 
                      backgroundColor: isDarkMode ? 'var(--card)' : 'var(--input-bg)', 
                      color: 'var(--text)'
                    }}
                  />
                </div>
                <div className="stat-item">
                  <label className="stat-label">Achievements</label>
                  <input
                    type="number"
                    className="form-control"
                    value={profile.gamingStats?.achievements || 0}
                    onChange={(e) => handleStatsChange('achievements', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    min="0"
                    style={{ 
                      backgroundColor: isDarkMode ? 'var(--card)' : 'var(--input-bg)', 
                      color: 'var(--text)'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset form
                      if (avatarPreview) {
                        URL.revokeObjectURL(avatarPreview);
                        setAvatarPreview(null);
                      }
                      setAvatarFile(null);
                    }}
                    style={{ 
                      backgroundColor: 'var(--button-bg)', 
                      color: 'var(--button-text)' 
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ 
                      backgroundColor: 'var(--primary)', 
                      color: 'white' 
                    }}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                  style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'white' 
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile; 