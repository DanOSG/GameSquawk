import React, { useState } from 'react';
import axios from 'axios';
import { FaDiscord, FaSteam, FaXbox } from 'react-icons/fa';
import './AuthButtons.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [xboxLogin, setXboxLogin] = useState(false);
  const [xboxData, setXboxData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const handleXboxChange = (e) => {
    setXboxData({ ...xboxData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    try {
      console.log('Attempting registration with:', { ...formData, password: '***' });
      const response = await axios.post(`${API_URL}/api/auth/register`, formData);
      console.log('Registration response:', response.data);
      setSuccess('Registration successful! You can now log in.');
      setFormData({ username: '', email: '', password: '' }); // Clear form
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
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
        
        // Redirect or update state as needed
        window.location.reload();
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
            <h2>Register</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <input 
              type="text" 
              name="username" 
              placeholder="Username" 
              value={formData.username}
              onChange={handleChange} 
              required
            />
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
            <button type="submit" className="primary-button">Register</button>
          </form>

          <div className="auth-divider">
            <span>or sign up with</span>
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
            Back to Registration
          </button>
        </form>
      )}
    </div>
  );
};

export default Register;
