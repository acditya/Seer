# Seer 🔮

**See through sound** - A voice-first navigation assistant for visually impaired users.

## Features

- 🎤 **Voice-first interface** - Press-to-talk interaction
- 👁️ **GPT-4o-mini vision** - AI sees through your camera in real-time
- 🧠 **Intelligent guidance** - Natural language directions to any destination
- 🔊 **Natural speech** - iOS built-in text-to-speech
- 📍 **Checkpoint navigation** - "Take me to the door", "Find the elevator"
- 📳 **Haptic feedback** - Feel when recording/navigating
- ♿ **Accessibility-focused** - Large touch targets, voice feedback

## Tech Stack

**Client:** Expo 54 (React Native + TypeScript)  
**Server:** Flask (Python)  
**AI:** OpenAI (Whisper STT + GPT-4o-mini Vision) + iOS TTS

## Quick Start

### 1. Server Setup

```bash
cd server
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
python main.py
```

### 2. Configure Environment

Create `server/.env`:

```bash
PORT=8000

# OpenAI API (for everything: Whisper STT + GPT-4o-mini vision)
OPENAI_API_KEY=sk-proj-your_key_here
```

### 3. Client Setup

```bash
cd client
npm install

# Update app.config.ts with your local IP
# serverUrl: 'http://YOUR_IP:8000'

npm start
```

### 4. Run on iPhone

1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Grant camera & microphone permissions
4. Start navigating!

## Usage

**Simple & Interrupt-based:**

1. **Press and hold** the green button
2. **Say your destination**: "elevator", "exit", "bathroom"
3. **Release** → App captures scene, analyzes, speaks ONCE
4. **Press again** to check scene or give commands
5. **Feel haptic feedback** for key events

**New flow:** No continuous loop! Press button → Analyze → Speak → Wait for next press.

### Voice Commands

- **"repeat"** - Hear last instruction again
- **"stop"** - End navigation
- **"new checkpoint [name]"** - Change destination
- **"I'm here"** - Mark destination reached

## Project Structure

```
seer/
├── client/          # Expo React Native app
│   ├── App.tsx
│   ├── src/
│   │   ├── api.ts                    # Server communication
│   │   ├── hooks/useNavigationLoop.ts # Navigation state machine
│   │   └── components/               # UI components
│   └── app.config.ts                 # App configuration
│
└── server/          # Flask Python API
    ├── main.py                       # API endpoints
    ├── stt.py                        # OpenAI Whisper STT
    ├── tts.py                        # Text passthrough (iOS TTS on client)
    ├── plan.py                       # GPT-4o-mini vision navigation
    └── state.py                      # Scene state tracking
```

## API Endpoints

- `POST /stt` - Speech to text (OpenAI Whisper)
- `POST /tts` - Text passthrough (client uses iOS TTS)
- `POST /plan` - Vision-based navigation (GPT-4o-mini analyzes camera image)
- `GET /scene` - Current scene state

## Development

**Server:**
```bash
cd server && python main.py
```

**Client:**
```bash
cd client && npm start
```

## Troubleshooting

**"Network error"**
- Update `serverUrl` in `client/app.config.ts` with your local IP
- Ensure server is running: visit `http://localhost:8000`
- Check both devices on same WiFi

**No camera preview**
- Grant camera permissions in iOS Settings → Expo Go

**Audio doesn't play**
- Check iPhone is not on silent mode
- Grant microphone permissions

## License

MIT

---

Built for accessibility. Powered by AI. 🎯
