import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Login = ({ setToken }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  return (
    <form onSubmit={handleSubmit}>
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
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
