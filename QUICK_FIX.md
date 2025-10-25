# 🔧 Quick Fix for Installation Issues

## ✅ I've Fixed Both Server & Client!

### What I Fixed:

1. **Server**: Updated dependencies to work with Python 3.13
2. **Client**: Added missing `babel-preset-expo` package
3. **Client**: Removed icon/splash requirements (not needed for Expo Go)

---

## 🚀 Try This Now!

### 1. Server Setup (FRESH INSTALL)

```powershell
# Delete old virtual environment
cd server
Remove-Item -Recurse -Force .venv

# Create new one
python -m venv .venv
.venv\Scripts\activate

# Upgrade pip first!
python -m pip install --upgrade pip

# Install dependencies (should work now)
pip install -r requirements.txt
```

**Expected Output:**
```
Successfully installed flask-3.1.0 flask-cors-5.0.0 ...
```

If it still fails, try Python 3.11 or 3.12 instead of 3.13:
```powershell
py -3.11 -m venv .venv
# or
py -3.12 -m venv .venv
```

### 2. Create .env File

```powershell
# Still in server/ directory
New-Item -ItemType File -Path .env

# Edit with notepad
notepad .env
```

Paste this (use YOUR actual API keys):
```bash
PORT=8000
YOLO_MODEL=yolov8n.pt

OPENAI_API_KEY=your_actual_key
OPENAI_API_BASE=https://your-endpoint
OPENAI_MODEL=gpt-4o-mini

ELEVENLABS_API_KEY=your_actual_key
ELEVENLABS_VOICE_ID=Rachel

WHISPER_API_KEY=your_actual_key
```

### 3. Run Server

```powershell
python main.py
```

✅ **Should see:**
```
Initializing YOLO detector...
Loading YOLO model: yolov8n.pt
YOLO model loaded successfully
Server ready!

🔮 Starting Seer server on http://0.0.0.0:8000
```

---

### 4. Client Setup (FRESH INSTALL)

```powershell
# Open NEW terminal
cd client

# Delete node_modules if exists
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Fresh install
npm install
```

**Expected Output:**
```
added 1234 packages in 45s
```

### 5. Update Server URL

```powershell
# Get your IP
ipconfig | findstr IPv4
```

Copy your IPv4 address (example: `192.168.1.100`)

Edit `client/app.config.ts` line 36:
```typescript
serverUrl: 'http://192.168.1.100:8000',  // ← YOUR IP HERE
```

### 6. Start Client

```powershell
npm start
```

Press `i` for iOS or scan QR code with Expo Go!

---

## 🐛 Still Having Issues?

### Server Issues

**"Rust compiler required"**
- You have Python 3.13 which is too new
- Install Python 3.11 or 3.12 from python.org
- Then recreate venv with that version

**"YOLO download fails"**
- Check internet connection
- Try disabling firewall temporarily
- Model will download to `server/yolov8n.pt`

### Client Issues

**"Cannot find module 'babel-preset-expo'"**
- Run: `npm install` again (I added it to package.json)
- If still fails: `npm install babel-preset-expo --save-dev`

**"Unable to resolve asset"**
- Fixed! I removed icon/splash requirements
- App will use default Expo icon

**"Network error" in app**
- Server must be running first!
- Check `http://localhost:8000` in browser
- Verify `serverUrl` in `app.config.ts` uses YOUR IP, not localhost

---

## 📝 Verification Checklist

Server:
- [ ] Virtual environment created
- [ ] Dependencies installed without errors
- [ ] `.env` file created with API keys
- [ ] `python main.py` shows "Server ready!"
- [ ] `http://localhost:8000` shows JSON response in browser

Client:
- [ ] Dependencies installed without errors
- [ ] `serverUrl` in `app.config.ts` updated with your IP
- [ ] `npm start` runs without errors
- [ ] Can scan QR code with Expo Go

---

## 🎯 Next Steps

Once both work:

1. **Open Expo Go** on iPhone
2. **Scan QR code** from terminal
3. Grant **camera & microphone** permissions
4. Hear: **"Hi, I'm Seer. Say a checkpoint."**
5. Press button → say "elevator" → get guided!

---

## 💡 Pro Tips

**Windows Python Version Check:**
```powershell
python --version
py -3.11 --version
py -3.12 --version
```

**Fresh Start (if all else fails):**
```powershell
# Server
cd server
Remove-Item -Recurse -Force .venv
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Client
cd client
Remove-Item -Recurse -Force node_modules
npm install
```

Good luck! 🚀

