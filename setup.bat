@echo off
REM Seer Setup Script for Windows
REM Automates the setup process for both server and client

echo.
echo ============================================
echo     Seer Setup Script for Windows
echo ============================================
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed
    echo Please install Python 3.9 or higher from https://www.python.org/downloads/
    exit /b 1
)
echo [OK] Python found
python --version

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js 18 or higher from https://nodejs.org/
    exit /b 1
)
echo [OK] Node.js found
node --version

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    echo Please install npm
    exit /b 1
)
echo [OK] npm found
npm --version

echo.
echo ============================================
echo Setting up server...
echo ============================================
echo.

cd server

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
    echo [OK] Virtual environment created
) else (
    echo [INFO] Virtual environment already exists
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo [OK] Python dependencies installed

REM Check for .env file
if not exist ".env" (
    echo [ERROR] .env file not found in server/
    echo Please create server/.env from ENV_TEMPLATE.txt
    echo Run: copy ENV_TEMPLATE.txt server\.env
    echo Then fill in your API keys
    deactivate
    cd ..
    pause
    exit /b 1
) else (
    echo [OK] .env file found
)

REM Deactivate virtual environment
deactivate

cd ..

echo.
echo ============================================
echo Setting up client...
echo ============================================
echo.

cd client

REM Install dependencies
echo Installing Node.js dependencies...
call npm install
echo [OK] Node.js dependencies installed

REM Check app.config.ts for SERVER_URL
findstr /C:"localhost:8000" app.config.ts >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] SERVER_URL still set to localhost in app.config.ts
    echo Please update SERVER_URL to your local IP address
    echo.
    echo Find your IP:
    echo   Run: ipconfig
    echo   Look for "IPv4 Address" under your active network adapter
    echo.
    echo Then update app.config.ts:
    echo   serverUrl: 'http://YOUR_IP:8000'
    echo.
)

cd ..

echo.
echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Next steps:
echo.
echo 1. Update server\.env with your API keys (if not done)
echo    - Azure OpenAI credentials
echo    - ElevenLabs API key
echo    - OpenAI API key (for Whisper)
echo.
echo 2. Update client\app.config.ts with your local IP
echo    - Run "ipconfig" to find your IP
echo    - Update serverUrl in app.config.ts
echo.
echo 3. Start the server:
echo    cd server
echo    .venv\Scripts\activate
echo    python main.py
echo.
echo 4. In a new terminal, start the client:
echo    cd client
echo    npm start
echo.
echo 5. Scan QR code with Expo Go on your iOS device
echo.
echo For detailed instructions, see:
echo   - QUICKSTART.md
echo   - README.md
echo.
echo Happy navigating!
echo.
pause

