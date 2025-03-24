import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthCallback = ({ setToken }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse query parameters
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    const username = queryParams.get('username');

    if (token && username) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Update app state
      setToken(token, username);
      
      // Redirect to home page
      navigate('/');
    } else {
      // If no token or error, redirect to login page
      navigate('/');
    }
  }, [location, navigate, setToken]);

  return (
    <div className="loading-container">
      <p>Processing authentication, please wait...</p>
    </div>
  );
};

export default AuthCallback; 