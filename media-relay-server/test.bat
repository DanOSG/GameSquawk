@echo off
echo GameSquawk Media Relay Server Test Client

echo:
echo Choose a test option:
echo 1. Run as User 1 in Room 1
echo 2. Run as User 2 in Room 1
echo 3. Run with custom User ID and Room ID
echo:

set /p option="Enter option (1-3): "

if "%option%"=="1" (
  set ROOM_ID=room1
  set USER_ID=test-user-1
  node test-client.js
) else if "%option%"=="2" (
  set ROOM_ID=room1
  set USER_ID=test-user-2
  node test-client.js
) else if "%option%"=="3" (
  set /p USER_ID="Enter User ID: "
  set /p ROOM_ID="Enter Room ID: "
  node test-client.js
) else (
  echo Invalid option selected!
  exit /b
) 