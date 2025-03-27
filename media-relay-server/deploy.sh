#!/bin/bash

# Media Relay Server Deployment Script

# Make script exit on any error
set -e

echo "Starting deployment of Media Relay Server..."

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating default .env file..."
  echo "PORT=3002" > .env
  echo "CLIENT_URL=https://your-production-domain.com" >> .env
  echo "Please update the CLIENT_URL in .env with your actual domain!"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2 globally..."
  npm install -g pm2
fi

# Start/restart the server with PM2
echo "Starting/restarting media relay server with PM2..."
pm2 stop media-relay 2>/dev/null || true
pm2 delete media-relay 2>/dev/null || true
pm2 start server.js --name media-relay

# Set up PM2 to restart on system reboot
echo "Setting up PM2 to start on system boot..."
pm2 save
pm2 startup | grep -v PM2

echo "Media Relay Server deployment completed!"
echo "To view logs: pm2 logs media-relay"
echo "To monitor: pm2 monit" 