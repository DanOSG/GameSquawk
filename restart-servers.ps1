# PowerShell script to restart both frontend and backend servers

Write-Host "Building frontend..." -ForegroundColor Cyan
cd frontend
npm run build
Write-Host "Frontend build complete!" -ForegroundColor Green

Write-Host "Starting backend server..." -ForegroundColor Cyan
cd ..
cd backend
Start-Process powershell -ArgumentList "node app.js"

Write-Host "Starting frontend server..." -ForegroundColor Cyan
cd ..
cd frontend
Start-Process powershell -ArgumentList "serve -s build"

Write-Host "Both servers are now starting!" -ForegroundColor Green 