# Windows Setup Guide for Seer

## Quick Fix for Your Setup

Your .env file looks good! I've updated the code to support your API configuration (standard OpenAI + custom endpoint).

### Step 1: Install Server Dependencies

```powershell
cd server
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

The Pillow version issue has been fixed. It should install successfully now.

### Step 2: Update Your .env

Based on what I see, you need to add these variables to your `server/.env`:

```bash
# Server Configuration
PORT=8000
YOLO_MODEL=yolov8n.pt

# OpenAI Configuration (you already have this)
OPENAI_API_KEY=AOcVw0K5QCZ7gVK...  # Your existing key
OPENAI_API_BASE=https://baian...  # Your existing endpoint
OPENAI_MODEL=gpt-4o-mini

# ElevenLabs (you already have this)
ELEVENLABS_API_KEY=sk_3bb70514...  # Your existing key
ELEVENLABS_VOICE_ID=Rachel

# Whisper (for speech-to-text)
WHISPER_API_KEY=AOcVw0K5QCZ7gVK...  # Use same as OPENAI_API_KEY
```

### Step 3: Start the Server

```powershell
# Still in server directory with .venv activated
python main.py
```

Wait for:
- "Initializing YOLO detector..." (first time: downloads ~6MB)
- "YOLO model loaded successfully"
- "Server ready!"
- "Starting Seer server on http://0.0.0.0:8000"

### Step 4: Get Your Local IP

In a new PowerShell window:

```powershell
ipconfig
```

Look for "IPv4 Address" under your WiFi adapter. Example: `192.168.1.100`

### Step 5: Setup Client

```powershell
cd client
npm install
```

Then edit `client/app.config.ts` and update line 36:

```typescript
serverUrl: process.env.SERVER_URL || 'http://192.168.1.100:8000',
//                                          ^^^^^^^^^^^^^^^ your IP here
```

### Step 6: Start Client

```powershell
npm start
```

### Step 7: Run on iOS

1. Open Expo Go on your iPhone
2. Scan the QR code
3. Grant camera and microphone permissions
4. You should hear: "Hi, I'm Seer. Say a checkpoint."

## Troubleshooting

### Pillow Still Fails
If Pillow installation still fails, try:
```powershell
pip install --upgrade pip setuptools wheel
pip install Pillow --no-cache-dir
pip install -r requirements.txt
```

### YOLO Download Fails
- Ensure internet connection
- Check firewall settings
- Model will be saved as `yolov8n.pt` in server directory

### "Module not found" Errors
Make sure virtual environment is activated:
```powershell
.venv\Scripts\activate
# You should see (.venv) in your prompt
```

### API Key Issues
Based on your .env, you're using:
- **Baian.AI** endpoint for OpenAI-compatible API
- Standard **ElevenLabs** for TTS
- Should work with **OpenAI Whisper** for STT

If Whisper fails, ensure `WHISPER_API_KEY` is valid for OpenAI API.

### "Network error" in App
- Verify server is running: 
  - Visit `http://localhost:8000` in browser - should show `{"status":"ok",...}`
  - Check PowerShell - should see "Server ready!" message
- Ensure `SERVER_URL` in `app.config.ts` uses your local IP, not `localhost`
- iPhone and PC must be on same WiFi network

## Next Steps

Once everything works:
1. Test with "Press to Talk" → say "elevator"
2. App should start guiding you
3. Try voice commands: "repeat", "stop", "new checkpoint exit"

Need more help? Check:
- `README.md` - Full documentation
- `CHECKLIST.md` - Step-by-step verification
- `API_TESTING.md` - Test server endpoints individually

