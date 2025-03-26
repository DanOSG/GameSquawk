import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AuthCallback = ({ setToken }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract authorization code from URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found in the callback URL');
        }

        // Exchange code for token
        const response = await fetch(`${API_URL}/api/auth/callback?code=${code}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to authenticate');
        }

        const data = await response.json();
        
        // Set token in parent component
        setToken(data.token, data.username);
        
        // Redirect to home page
        navigate('/');
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    processCallback();
  }, [location, navigate, setToken]);

  if (loading) {
    return (
      <div className="auth-callback-container">
        <div className="loading-spinner"></div>
        <p>Completing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-callback-container error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Return to Login</button>
      </div>
    );
  }

  return null; // This component redirects, so it doesn't need to render anything
};

export default AuthCallback; 