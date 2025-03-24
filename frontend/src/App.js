import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import Register from './Register';
import Login from './Login';
import PostForm from './PostForm';
import PostList from './PostList';
import Profile from './Profile';
import PublicProfile from './PublicProfile';
import Sidebar from './components/Sidebar';
import { FiMenu } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') !== 'false');
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Fetch user profile to get avatar
    if (token) {
      fetchUserAvatar();
    }
  }, [token]);

  const fetchUserAvatar = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.avatar) {
          setUserAvatar(`${API_URL}${data.avatar}`);
        }
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
    }
  };

  const handleLogin = (newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setUserAvatar(null);
    setIsSidebarOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleDeletePost = async (postId) => {
    try {
      await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <Router>
      <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="banner"></div>
        <div className={`logo ${isSidebarOpen ? 'expanded' : ''}`}>
          <img 
            src="/images/logo.png" 
            alt="GameSquawk Logo" 
          />
          {token && userAvatar && (
            <Link to="/profile" className="user-avatar-container">
              <img 
                src={userAvatar} 
                alt={username} 
                className="user-avatar" 
              />
            </Link>
          )}
        </div>
        {token && (
          <>
            <button className="menu-button" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
              <FiMenu />
            </button>
            <Sidebar 
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onLogout={handleLogout}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
              userAvatar={userAvatar}
            />
          </>
        )}
        <div className="app-container">
          <h1>GameSquawk</h1>
          <Routes>
            {token ? (
              <>
                <Route path="/" element={
                  <>
                    <PostForm token={token} />
                    <PostList token={token} onDeletePost={handleDeletePost} />
                  </>
                } />
                <Route path="/profile" element={
                  <Profile 
                    token={token} 
                    username={username} 
                    isDarkMode={isDarkMode}
                    onAvatarUpdate={fetchUserAvatar} 
                  />
                } />
                <Route path="/profile/:userId" element={
                  <PublicProfile token={token} />
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={
                  <>
                    <Register />
                    <Login setToken={handleLogin} />
                  </>
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;