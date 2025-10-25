# Seer — See through sound.

A voice-first navigation helper for visually impaired users. Seer uses real-time object detection (YOLO), AI reasoning (Azure OpenAI), and natural voice guidance (ElevenLabs) to help users navigate to spoken checkpoints.

## Architecture

- **Client**: Expo 54 iOS app (React Native + TypeScript)
- **Server**: FastAPI (Python) with YOLOv8, Azure OpenAI, ElevenLabs, and Whisper

## Features

- 🎤 **Voice-first UX**: Press-to-talk interface for hands-free navigation
- 📸 **Real-time detection**: Camera captures frames every ~1.2s for YOLO object detection
- 🧠 **AI guidance**: Azure OpenAI reasons about detections to provide safe, terse instructions
- 🔊 **Natural speech**: ElevenLabs TTS for clear spoken directions
- 🎯 **Checkpoint navigation**: Say a destination ("elevator"), get guided step-by-step
- ♿ **Accessibility-first**: Haptics, large touch targets, spoken feedback

## Project Structure

```
seer/
├── README.md
├── .env.example
├── client/              # Expo 54 React Native app
│   ├── app.json
│   ├── app.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── babel.config.js
│   ├── App.tsx
│   └── src/
│       ├── api.ts
│       ├── hooks/
│       │   └── useNavigationLoop.ts
│       ├── components/
│       │   ├── PressToTalk.tsx
│       │   ├── StatusChip.tsx
│       │   └── InstructionBanner.tsx
│       └── styles/
│           └── tokens.ts
└── server/              # FastAPI Python backend
    ├── main.py
    ├── requirements.txt
    ├── model.py
    ├── tts.py
    ├── stt.py
    ├── plan.py
    └── static/          # Temporary MP3 files
```

## Setup

### 1. Environment Variables

Create a `.env` file in the `server/` directory with the following content:

```bash
# Server Configuration
PORT=8000
YOLO_MODEL=yolov8n.pt

# Azure OpenAI (for navigation planning)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini

# ElevenLabs (for text-to-speech)
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=Rachel

# Whisper (for speech-to-text)
WHISPER_API_KEY=your_openai_key_here
```

Required secrets to fill in:
- **AZURE_OPENAI_ENDPOINT**: Your Azure OpenAI endpoint URL
- **AZURE_OPENAI_API_KEY**: Your Azure OpenAI API key
- **AZURE_OPENAI_DEPLOYMENT**: Deployment name (e.g., `gpt-4o-mini`)
- **ELEVENLABS_API_KEY**: Your ElevenLabs API key
- **ELEVENLABS_VOICE_ID**: Voice ID (default: `Rachel`)
- **WHISPER_API_KEY**: OpenAI API key for Whisper

### 2. Server Setup

```bash
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

# Run server (loads YOLO model on startup)
python main.py
```

The server will:
- Download YOLOv8n model on first run (~6MB)
- Start on `http://localhost:8000`

### 3. Client Setup

In a new terminal:

```bash
cd client

# Install dependencies (choose one)
npm install
# or
yarn install
# or
pnpm install

# Update SERVER_URL in app.config.ts
# Set to your local IP (not localhost) for Expo Go testing
# Example: http://192.168.1.100:8000

# Start Expo dev server
npm run start
# or
expo start
```

### 4. iOS Setup

1. Install **Expo Go** on your iOS device
2. Ensure your device is on the same WiFi network as your development machine
3. Scan the QR code from the Expo dev server
4. Grant **Camera** and **Microphone** permissions when prompted

## iOS Permissions

The app requires:
- **Camera**: To capture frames for object detection
- **Microphone**: To record voice commands

These are declared in `app.json` and requested at runtime. The app will not function without these permissions.

## Usage Flow

### State Machine

```
ASK_GOAL → NAVIGATING → REACHED → ASK_NEXT | END
```

### Quick Start (90-second demo)

1. **Launch**: Open app → Grant camera & mic permissions
2. **Hear**: "Hi, I'm Seer. Say a checkpoint."
3. **Press & Speak**: Hold button → Say "elevator" → Release
4. **Navigate**: App announces instructions every ~1.2s:
   - "Continue straight for three steps."
   - "Pause. Person passing on your left."
   - "Move forward two steps; door ahead."
5. **Reached**: Haptic feedback + "You've reached the elevator."
6. **New Goal**: Press again → Say "new checkpoint exit" → Continue

### Voice Commands

While not navigating:
- Say any checkpoint name: `"bathroom"`, `"exit"`, `"water fountain"`

While navigating:
- **"repeat"**: Hear last instruction again
- **"stop"**: End navigation
- **"new checkpoint [name]"**: Change destination mid-route
- **"I'm here"**: Mark current checkpoint as reached

## API Endpoints

### POST /stt
- **Input**: Multipart audio file (m4a or wav)
- **Output**: `{ "text": "..." }`
- Transcribes speech using Whisper

### POST /tts
- **Input**: JSON `{ "text": "Walk forward" }`
- **Output**: `{ "url": "/static/abc-123.mp3" }`
- Generates speech using ElevenLabs

### POST /detect
- **Input**: Multipart image (JPEG)
- **Output**: 
  ```json
  {
    "img_w": 1280,
    "img_h": 720,
    "detections": [
      { "cls": "person", "conf": 0.84, "xywh": [640, 420, 200, 300] }
    ]
  }
  ```
- Runs YOLOv8 object detection

### POST /plan
- **Input**: 
  ```json
  {
    "checkpoint": "elevator",
    "detections": [...],
    "recent_instructions": ["Continue straight"],
    "history_snippets": ["user: elevator", "seer: Walk forward"]
  }
  ```
- **Output**:
  ```json
  {
    "instruction": "Walk forward three steps.",
    "urgency": "normal",
    "reached": false,
    "reason": "clear path"
  }
  ```
- Uses Azure OpenAI to reason about scene and generate next instruction

## Development Notes

### Client
- TypeScript strict mode enabled
- Zod validation for server responses
- Haptics for state changes (instruction, reached, pause)
- Prevents overlapping navigation cycles (queue-based)
- Accessible UI with large touch targets and labels

### Server
- YOLO model loaded once at startup (in-memory)
- TTS files written to `/static/<uuid>.mp3` (temporary storage)
- CORS enabled for Expo development
- Low temperature (0.2) for deterministic AI planning
- Few-shot prompting for consistent instruction format

### Error Handling
- Network errors spoken via TTS: "Network error"
- Logs errors to console for debugging
- Graceful fallbacks (e.g., skip frame if busy)

## 90-Second Demo Script

Here's a quick demo flow to showcase Seer's capabilities:

**0:00 - Launch & Setup (15s)**
- Open app on iOS device
- Grant camera and microphone permissions
- Hear: "Hi, I'm Seer. Say a checkpoint."

**0:15 - Set First Checkpoint (10s)**
- Press and hold the button
- Say: "elevator"
- Release button
- Hear: "Navigating to elevator."

**0:25 - Navigate with Instructions (30s)**
- Hold phone at waist level, camera pointing forward
- Every ~1.2 seconds, receive spoken instructions:
  - "Continue straight for three steps."
  - "Pause. Person passing on your left."
  - "Slight right. Chair detected ahead."
  - "Move forward two steps; elevator ahead."
- Hear: "You've reached the elevator."
- Feel haptic success feedback

**0:55 - Change Destination (15s)**
- Press and hold button
- Say: "new checkpoint exit"
- Release button
- Hear: "Navigating to exit."
- Receive new instructions based on current scene

**1:10 - Test Voice Commands (10s)**
- Press and hold
- Say: "repeat"
- Hear last instruction again

**1:20 - Manual Arrival (5s)**
- Press and hold
- Say: "I'm here"
- Hear: "You've reached the exit."

**1:25 - End Demo (5s)**
- Press and hold
- Say: "stop"
- Navigation ends

## Troubleshooting

**Issue**: "Network error" spoken repeatedly
- **Fix**: Ensure server is running and `SERVER_URL` in `app.config.ts` uses your local IP (not `localhost`)

**Issue**: No camera preview
- **Fix**: Grant camera permissions in iOS Settings → Expo Go

**Issue**: Audio doesn't play
- **Fix**: Check iOS mute switch, grant microphone permissions

**Issue**: YOLO model download fails
- **Fix**: Run server with internet connection first time; model cached after first download

**Issue**: Azure OpenAI errors
- **Fix**: Verify `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT` in `.env`

## License

MIT

## Credits

Built for accessibility. Powered by YOLOv8, Azure OpenAI, ElevenLabs, and Whisper.
