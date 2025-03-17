import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
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

  return (
    <form onSubmit={handleSubmit} className="auth-form">
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
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
