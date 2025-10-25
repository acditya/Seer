# 🔮 Seer - START HERE

## Super Quick Start (3 Commands)

### 1. Install Server Dependencies

```powershell
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create .env File

Create `server/.env` with your API keys:

```bash
PORT=8000
YOLO_MODEL=yolov8n.pt

# Use your existing API keys
OPENAI_API_KEY=your_key_here
OPENAI_API_BASE=https://your-endpoint
OPENAI_MODEL=gpt-4o-mini

ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=Rachel

WHISPER_API_KEY=your_openai_key
```

### 3. Run Server

```powershell
python main.py
```

You should see:
```
Initializing YOLO detector...
Loading YOLO model: yolov8n.pt
YOLO model loaded successfully
Server ready!

🔮 Starting Seer server on http://0.0.0.0:8000
📖 API endpoints: http://localhost:8000/
Press Ctrl+C to stop
```

## Test It

Open browser to `http://localhost:8000/`

You should see:
```json
{
  "status": "ok",
  "message": "Seer API is running",
  "endpoints": ["/stt", "/tts", "/detect", "/plan"]
}
```

✅ **Server is working!**

## Next: Setup Client

### 1. Install & Configure

```powershell
# In a NEW terminal
cd client
npm install
```

### 2. Get Your Local IP

```powershell
ipconfig
```

Look for **IPv4 Address** (example: `192.168.1.100`)

### 3. Update app.config.ts

Edit `client/app.config.ts` line 36:

```typescript
serverUrl: 'http://192.168.1.100:8000',  // ← your IP here
```

### 4. Start Client

```powershell
npm start
```

### 5. Run on iPhone

1. Install **Expo Go** from App Store
2. Scan QR code from terminal
3. Grant camera & microphone permissions
4. Hear: **"Hi, I'm Seer. Say a checkpoint."**

## Quick Test

1. **Press and hold** the big button
2. Say **"elevator"**
3. **Release** button
4. App should say: **"Navigating to elevator."**
5. You'll get instructions every ~1.2 seconds!

## Troubleshooting

### Pillow won't install?
```powershell
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### "Network error" in app?
- Check server is running (should see "Server ready!")
- Verify `SERVER_URL` in `app.config.ts` uses YOUR IP, not `localhost`
- Ensure iPhone and PC on same WiFi

### No camera preview?
- Grant camera permissions in iOS Settings → Expo Go

### Audio doesn't play?
- Check iPhone is not on silent mode
- Grant microphone permissions

## Need More Help?

- **Full Guide**: [README.md](README.md)
- **Windows Specific**: [WINDOWS_SETUP.md](WINDOWS_SETUP.md)
- **API Testing**: [API_TESTING.md](API_TESTING.md)
- **Checklist**: [CHECKLIST.md](CHECKLIST.md)

Happy navigating! 🎯

