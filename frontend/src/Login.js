import React, { useState } from 'react';
import axios from 'axios';
import { FaDiscord, FaSteam, FaXbox } from 'react-icons/fa';
import './AuthButtons.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Login = ({ setToken }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [xboxLogin, setXboxLogin] = useState(false);
  const [xboxData, setXboxData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleXboxChange = (e) => {
    setXboxData({ ...xboxData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, formData);
      const { token, username } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Update app state
      setToken(token, username);
      
      // Clear form
      setFormData({ email: '', password: '' });
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleXboxSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!xboxData.email || !xboxData.password) {
      setError('Email and password are required for Xbox login');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/auth/xbox`, xboxData);
      
      if (response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);
        
        // Update app state
        setToken(response.data.token, response.data.username);
      }
    } catch (error) {
      console.error('Xbox login error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Xbox authentication failed');
    }
  };

  return (
    <div className="auth-container">
      {!xboxLogin ? (
        <>
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              value={formData.email}
              onChange={handleChange} 
              required
            />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              value={formData.password}
              onChange={handleChange} 
              required
            />
            <button type="submit" className="primary-button">Login</button>
          </form>

          <div className="auth-divider">
            <span>or sign in with</span>
          </div>

          <div className="social-login-buttons">
            <a href={`${API_URL}/api/auth/discord`} className="social-button discord">
              <FaDiscord /> Discord
            </a>
            <a href={`${API_URL}/api/auth/steam`} className="social-button steam">
              <FaSteam /> Steam
            </a>
            <button onClick={() => setXboxLogin(true)} className="social-button xbox">
              <FaXbox /> Xbox
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleXboxSubmit} className="auth-form">
          <h2>Xbox Live Login</h2>
          {error && <div className="error-message">{error}</div>}
          <p className="form-info">Sign in with your Xbox Live account</p>
          <input 
            type="email" 
            name="email" 
            placeholder="Microsoft Email" 
            value={xboxData.email}
            onChange={handleXboxChange} 
            required
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={xboxData.password}
            onChange={handleXboxChange} 
            required
          />
          <button type="submit" className="primary-button xbox">Sign in with Xbox</button>
          <button 
            type="button" 
            onClick={() => setXboxLogin(false)} 
            className="secondary-button"
          >
            Back to Login
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;
