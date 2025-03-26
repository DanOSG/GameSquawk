import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUpload, FiVideo, FiX } from 'react-icons/fi';
import './VideoUpload.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VideoUpload = ({ token }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check if file is a video
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return;
    }
    
    // Check file size (100MB max)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit.');
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
    
    // Create a preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a video file to upload.');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your video.');
      return;
    }
    
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    
    try {
      const response = await axios.post(`${API_URL}/api/videos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      
      setUploading(false);
      navigate(`/videos/${response.data.video.id}`);
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.message || 'An error occurred while uploading. Please try again.');
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="video-upload-container">
      <h2>Upload Video</h2>
      
      {error && <div className="upload-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            placeholder="Add a title that describes your video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength="100"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Tell viewers about your video (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            maxLength="5000"
          />
        </div>
        
        <div className="form-group">
          <label>Video File *</label>
          
          {!file ? (
            <div className="file-upload-area">
              <input
                type="file"
                id="video-file"
                accept="video/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="video-file" className="file-upload-label">
                <FiUpload size={24} />
                <span>Click to select or drag video here</span>
                <small>MP4, MOV, or AVI up to 100MB</small>
              </label>
            </div>
          ) : (
            <div className="file-preview">
              <div className="file-preview-header">
                <FiVideo size={20} />
                <span className="file-name">{fileName}</span>
                <button 
                  type="button" 
                  className="remove-file-btn"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <FiX size={18} />
                </button>
              </div>
              {previewUrl && (
                <video controls src={previewUrl} className="video-preview" />
              )}
            </div>
          )}
        </div>
        
        {uploading && (
          <div className="upload-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span className="progress-text">{uploadProgress}% Uploaded</span>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/videos')}
            disabled={uploading}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="upload-button"
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoUpload; 