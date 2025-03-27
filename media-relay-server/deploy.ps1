# Media Relay Server Deployment Script for Windows

Write-Host "Starting deployment of Media Relay Server..." -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install --production

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "Creating default .env file..." -ForegroundColor Cyan
    "PORT=3002" | Out-File -FilePath .env -Encoding utf8
    "CLIENT_URL=https://your-production-domain.com" | Out-File -FilePath .env -Append -Encoding utf8
    Write-Host "Please update the CLIENT_URL in .env with your actual domain!" -ForegroundColor Yellow
}

# Check if PM2 is installed
$pm2Installed = $null
try {
    $pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
} catch {
    # PM2 not found
}

if ($null -eq $pm2Installed) {
    Write-Host "Installing PM2 globally..." -ForegroundColor Cyan
    npm install -g pm2
}

# Start/restart the server with PM2
Write-Host "Starting/restarting media relay server with PM2..." -ForegroundColor Cyan
try {
    pm2 stop media-relay
    pm2 delete media-relay
} catch {
    # Ignore errors if process doesn't exist
}

pm2 start server.js --name media-relay

# Set up PM2 to restart on system reboot
Write-Host "Setting up PM2 to start on system boot..." -ForegroundColor Cyan
pm2 save

Write-Host "Media Relay Server deployment completed!" -ForegroundColor Green
Write-Host "To view logs: pm2 logs media-relay" -ForegroundColor Magenta
Write-Host "To monitor: pm2 monit" -ForegroundColor Magenta 