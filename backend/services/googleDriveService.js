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

      await this.makeFilePublic(response.data.id);
      
      // Get the updated file with public links
      const file = await this.getFileInfo(response.data.id);
      return file;
    } catch (error) {
      console.error('Error uploading video to Google Drive:', error);
      throw error;
    }
  }

  async makeFilePublic(fileId) {
    try {
      await this.driveClient.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      console.log(`File ${fileId} is now public`);
    } catch (error) {
      console.error('Error making file public:', error);
      throw error;
    }
  }

  async getFileInfo(fileId) {
    try {
      const response = await this.driveClient.files.get({
        fileId: fileId,
        fields: 'id, name, description, webViewLink, webContentLink, thumbnailLink, createdTime, mimeType, size'
      });
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
        orderBy: 'createdTime desc'
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