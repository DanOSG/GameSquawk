import React, { useState, useEffect } from 'react';
import './App.css';
import Register from './Register';
import Login from './Login';
import PostForm from './PostForm';
import PostList from './PostList';
import Sidebar from './components/Sidebar';
import { FiMenu } from 'react-icons/fi';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('darkMode') !== 'false');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

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
    setIsSidebarOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleDeletePost = async (postId) => {
    try {
      await fetch(`http://localhost:3001/api/posts/${postId}`, {
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
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="banner"></div>
      <div className={`logo ${isSidebarOpen ? 'expanded' : ''}`}>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          src="https://media.tenor.com/NRBEZ5m_UL4AAAPo/spider-man-dance.mp4"
        >
          <source src="https://media.tenor.com/NRBEZ5m_UL4AAAPo/spider-man-dance.mp4" type="video/mp4" />
        </video>
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
          />
        </>
      )}
      <div className="app-container">
        <h1>IDK Blog</h1>
        {token ? (
          <>
            <PostForm token={token} />
            <PostList token={token} onDeletePost={handleDeletePost} />
          </>
        ) : (
          <>
            <Register />
            <Login setToken={handleLogin} />
          </>
        )}
      </div>
    </div>
  );
};

export default App;