import React from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiSun, FiMoon, FiLogOut, FiHome, FiUser } from 'react-icons/fi';

const Sidebar = ({ 
  isOpen, 
  onClose, 
  onLogout, 
  isDarkMode, 
  toggleTheme, 
  userAvatar 
}) => {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="close-button" onClick={onClose}>
          <FiX size={24} />
        </button>
        
        <div className="sidebar-content">
          {userAvatar && (
            <div className="sidebar-user">
              <img src={userAvatar} alt="User Avatar" className="sidebar-avatar" />
            </div>
          )}
          
          <div className="sidebar-section">
            <Link to="/" className="sidebar-item" onClick={onClose}>
              <FiHome size={20} />
              <span>Home</span>
            </Link>
            
            <Link to="/profile" className="sidebar-item" onClick={onClose}>
              <FiUser size={20} />
              <span>Profile</span>
            </Link>
            
            <button 
              className="sidebar-item theme-toggle"
              onClick={() => {
                toggleTheme();
                onClose();
              }}
            >
              {isDarkMode ? (
                <>
                  <FiSun size={20} />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <FiMoon size={20} />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            
            <button className="sidebar-item logout" onClick={onLogout}>
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 