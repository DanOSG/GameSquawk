const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// The ID of the folder where all videos will be stored
const FOLDER_ID = '138f5agtI-ibTYb6Fi-Xgyh3xIHYevhXK';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

class GoogleDriveService {
  constructor() {
    this.initializeClient();
  }

  initializeClient() {
    try {
      const keyFile = path.join(__dirname, '..', 'config', 'google-drive-credentials.json');
      const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: SCOPES
      });
      
      this.driveClient = google.drive({ version: 'v3', auth });
      console.log('Google Drive client initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Drive client:', error);
      throw error;
    }
  }

  async uploadVideo(filePath, mimeType, title, description) {
    try {
      const fileMetadata = {
        name: title || path.basename(filePath),
        description: description || '',
        parents: [FOLDER_ID]
      };

      const media = {
        mimeType: mimeType || 'video/mp4',
        body: fs.createReadStream(filePath)
      };

      const response = await this.driveClient.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink, thumbnailLink, createdTime'
      });

      // Make sure the file is publicly accessible
      await this.makeFilePublic(response.data.id);
      
      // Get the updated file with public links
      const file = await this.getFileInfo(response.data.id);
      
      // Create a direct embed link
      const embedLink = `https://drive.google.com/file/d/${file.id}/preview`;
      file.embedLink = embedLink;
      
      // Create a custom thumbnail URL using Google Drive's thumbnail format
      // This works better than the default thumbnailLink from the API
      file.thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w320-h180-n`;
      
      return file;
    } catch (error) {
      console.error('Error uploading video to Google Drive:', error);
      throw error;
    }
  }

  async makeFilePublic(fileId) {
    try {
      // First, set the file to be publicly accessible
      await this.driveClient.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        },
        fields: 'id'
      });
      
      // Then, update the file to allow embedding
      await this.driveClient.files.update({
        fileId: fileId,
        requestBody: {
          // This ensures the file can be embedded
          copyRequiresWriterPermission: false
        }
      });
      
      console.log(`File ${fileId} is now public and embeddable`);
    } catch (error) {
      console.error('Error making file public:', error);
      throw error;
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await this.driveClient.files.get({
        fileId: fileId,
        fields: 'id, name, description, webViewLink, webContentLink, thumbnailLink, createdTime, mimeType, size',
        // Include auth token in URL to ensure accessibility
        supportsAllDrives: true
      });
      
      // Add direct embed link
      response.data.embedLink = `https://drive.google.com/file/d/${fileId}/preview`;
      
      // Add custom thumbnail URL
      response.data.thumbnailLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w320-h180-n`;
      
      return response.data;
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  }

  async listFiles() {
    try {
      const response = await this.driveClient.files.list({
        q: `'${FOLDER_ID}' in parents and trashed = false`,
        fields: 'files(id, name, description, webViewLink, webContentLink, thumbnailLink, createdTime, mimeType, size)',
        orderBy: 'createdTime desc',
        supportsAllDrives: true
      });
      
      // Add embed links and custom thumbnails to all files
      response.data.files = response.data.files.map(file => {
        file.embedLink = `https://drive.google.com/file/d/${file.id}/preview`;
        file.thumbnailLink = `https://drive.google.com/thumbnail?id=${file.id}&sz=w320-h180-n`;
        return file;
      });
      
      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.driveClient.files.delete({
        fileId: fileId
      });
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService(); 