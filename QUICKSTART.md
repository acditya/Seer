# Seer - Quick Start Guide

Get Seer running in 5 minutes.

## Prerequisites

- **Python 3.9+** (for server)
- **Node.js 18+** and **npm/yarn/pnpm** (for client)
- **iOS device** with Expo Go app installed
- API keys for:
  - Azure OpenAI
  - ElevenLabs
  - OpenAI (for Whisper)

## Step 1: Server Setup (3 minutes)

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
PORT=8000
YOLO_MODEL=yolov8n.pt
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=Rachel
WHISPER_API_KEY=your_openai_key_here
EOF

# Edit .env with your actual API keys
nano .env  # or use your preferred editor

# Run server
python main.py
```

**First run:** YOLO model (~6MB) will download automatically. Wait for "Server ready!" message.

Server is now running at `http://localhost:8000`

## Step 2: Client Setup (2 minutes)

In a **new terminal**:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install
# or: yarn install
# or: pnpm install

# Get your local IP address
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows:
ipconfig | findstr IPv4

# Edit app.config.ts and update SERVER_URL
# Replace 'http://localhost:8000' with 'http://YOUR_IP:8000'
# Example: http://192.168.1.100:8000
nano app.config.ts

# Start Expo
npm start
```

## Step 3: Run on iOS Device (1 minute)

1. Open **Expo Go** app on your iOS device
2. Scan the QR code from the terminal
3. Grant **Camera** and **Microphone** permissions when prompted
4. Wait for app to load

## Step 4: Test It Out!

1. You'll hear: **"Hi, I'm Seer. Say a checkpoint."**
2. Press and hold the big button
3. Say **"elevator"** (or any checkpoint)
4. Release the button
5. App will start guiding you every ~1.2 seconds

## Voice Commands

**Setting checkpoint:**
- Just say the destination: "bathroom", "exit", "water fountain"

**During navigation:**
- **"repeat"** - Hear last instruction again
- **"stop"** - End navigation
- **"new checkpoint [name]"** - Change destination
- **"I'm here"** - Mark destination as reached

## Troubleshooting

### "Network error" repeated
- ✅ Ensure server is running (`http://localhost:8000/docs` should work)
- ✅ Update `SERVER_URL` in `app.config.ts` to use your IP, not localhost
- ✅ Ensure device and computer are on same WiFi network

### No camera preview
- ✅ Grant camera permissions in iOS Settings → Expo Go

### Audio doesn't play
- ✅ Check iOS mute switch
- ✅ Grant microphone permissions

### YOLO model errors
- ✅ Ensure internet connection on first run (model downloads once)
- ✅ Check `server/yolov8n.pt` exists after first run

### Azure OpenAI errors
- ✅ Verify endpoint URL format: `https://your-resource.openai.azure.com/`
- ✅ Verify deployment name matches your Azure OpenAI deployment
- ✅ Check API key is valid

## Next Steps

- Customize YOLO detections in `server/model.py`
- Adjust navigation prompt in `server/plan.py`
- Modify voice UI in `client/src/components/`
- Add custom voice commands in `client/src/hooks/useNavigationLoop.ts`

## Support

Issues? Check the full [README.md](README.md) for detailed documentation.

Happy navigating! 🎯

