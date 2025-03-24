import React from 'react';
import { Link } from 'react-router-dom';
import { FiLogOut, FiSun, FiMoon, FiHome, FiBookmark, FiTrendingUp, FiSettings, FiUser } from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose, onLogout, isDarkMode, toggleTheme }) => {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <Link to="/" className="sidebar-item active" onClick={onClose}>
              <FiHome /> Home
            </Link>
            <button className="sidebar-item">
              <FiTrendingUp /> Trending
            </button>
            <button className="sidebar-item">
              <FiBookmark /> Bookmarks
            </button>
            <Link to="/profile" className="sidebar-item" onClick={onClose}>
              <FiUser /> Profile
            </Link>
          </div>
          
          <div className="sidebar-section">
            <button className="sidebar-item" onClick={toggleTheme}>
              {isDarkMode ? <FiSun /> : <FiMoon />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="sidebar-item">
              <FiSettings /> Settings
            </button>
            <button className="sidebar-item logout" onClick={onLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 