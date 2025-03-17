import React, { useState } from 'react';
import axios from 'axios';
import ReactMde from 'react-mde';
import "react-mde/lib/styles/css/react-mde-all.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CATEGORIES = [
  'Technology',
  'Lifestyle',
  'Travel',
  'Food',
  'Health'
];

const PostForm = ({ token }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    content: '', 
    category: CATEGORIES[0] // Default to first category
  });
  const [selectedTab, setSelectedTab] = useState("write");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
  };

  const generateMarkdownPreview = (markdown) => {
    return Promise.resolve(
      <div className="mde-preview-content">
        <ReactMarkdown>{markdown || ''}</ReactMarkdown>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/posts', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Clear form after successful submission
      setFormData({ title: '', content: '', category: CATEGORIES[0] });
      setSelectedTab("write");
      window.location.reload(); // Refresh to show new post
    } catch (error) {
      alert('Post creation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <div className="form-group">
        <input 
          type="text" 
          name="title" 
          placeholder="Title" 
          value={formData.title}
          onChange={handleChange} 
        />
      </div>
      <div className="form-group">
        <ReactMde
          value={formData.content}
          onChange={handleContentChange}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          generateMarkdownPreview={generateMarkdownPreview}
        />
      </div>
      <div className="form-group">
        <select 
          name="category" 
          value={formData.category}
          onChange={handleChange}
          className="category-dropdown"
        >
          {CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="submit-button">Create Post</button>
    </form>
  );
};

export default PostForm;
