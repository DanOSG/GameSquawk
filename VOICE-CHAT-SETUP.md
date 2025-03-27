# Voice Chat Setup Guide for GameSquawk

This guide explains how to set up the voice chat solution using a dedicated media relay server instead of WebRTC.

## Overview

Instead of using WebRTC peer-to-peer connections which were causing issues, this solution uses:

1. A dedicated media relay server that runs on a separate VPS
2. Socket.io for real-time communication
3. Audio streaming through WebSockets

## Architecture

- **Main Server**: Your existing backend that handles authentication, chat history, and user presence
- **Media Relay Server**: A new separate server that handles only the audio streaming
- **Client**: The frontend that connects to both servers

## Setup Instructions

### 1. Media Relay Server Setup (on your second VPS)

1. Clone the repository on your second VPS:

```bash
git clone <your-repo-url>
cd <your-repo-directory>
```

2. Copy the media relay server files to a dedicated directory:

```bash
cp -r media-relay-server /path/to/destination
cd /path/to/destination
```

3. Install dependencies:

```bash
npm install --production
```

4. Create a `.env` file:

```bash
# Replace with your actual main site URL
echo "PORT=3002" > .env
echo "CLIENT_URL=https://your-main-site-domain.com" >> .env
```

5. Install PM2 (if not already installed):

```bash
npm install -g pm2
```

6. Start the media relay server with PM2:

```bash
pm2 start server.js --name media-relay
pm2 save
pm2 startup
```

7. Configure Nginx as a reverse proxy (recommended for production):

```bash
sudo nano /etc/nginx/sites-available/media-relay
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name media.your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/media-relay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. Set up SSL (recommended for production):

```bash
sudo certbot --nginx -d media.your-domain.com
```

### 2. Frontend Configuration

1. Update your frontend `.env` file with the media server URL:

```
REACT_APP_MEDIA_SERVER_URL=https://media.your-domain.com
```

2. Build and deploy your frontend:

```bash
npm run build
# deploy to your hosting service
```

### 3. Testing the Setup

1. Open your application in multiple browsers or devices
2. Navigate to the lobby
3. Test voice chat by unmuting and speaking
4. Check the logs on both servers for any issues:

```bash
# On main server
pm2 logs

# On media relay server
pm2 logs media-relay
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure the `CLIENT_URL` in your media server's `.env` file matches your actual frontend domain.

2. **Connection Issues**: Check if your firewall allows WebSocket connections on the media server port (default: 3002).

3. **Audio Not Working**: Check browser console for errors related to audio access. Sometimes users need to grant microphone permissions.

4. **High Latency**: Adjust the media recorder chunk size and bitrate in the frontend code.

## Security Considerations

- The media relay server does not perform authentication itself but relies on the user ID passed from the frontend
- For added security in production, implement a token-based authentication between the frontend and media server
- Always use HTTPS in production to encrypt the audio data

## Monitoring

You can monitor the media relay server using PM2:

```bash
pm2 monit
```

This will show CPU, memory usage, and logs in real-time.

## Scaling

If you need to scale beyond a single media server:

1. Set up multiple media relay servers
2. Use a load balancer to distribute connections
3. Implement a room-based sharding strategy to route users to the same server based on their room ID 