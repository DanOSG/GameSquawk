import React from 'react';
import { FiLogOut, FiSun, FiMoon, FiHome, FiBookmark, FiTrendingUp, FiSettings } from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose, onLogout, isDarkMode, toggleTheme }) => {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <button className="sidebar-item active">
              <FiHome /> Home
            </button>
            <button className="sidebar-item">
              <FiTrendingUp /> Trending
            </button>
            <button className="sidebar-item">
              <FiBookmark /> Bookmarks
            </button>
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