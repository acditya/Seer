# Seer Setup & Acceptance Checklist

Use this checklist to verify your Seer installation is complete and working.

## ✅ File Structure

Verify all files are present:

```
✓ Root files
  ✓ README.md
  ✓ QUICKSTART.md
  ✓ API_TESTING.md
  ✓ CONTRIBUTING.md
  ✓ LICENSE
  ✓ .gitignore
  ✓ CHECKLIST.md (this file)

✓ Server files (server/)
  ✓ main.py
  ✓ requirements.txt
  ✓ model.py
  ✓ tts.py
  ✓ stt.py
  ✓ plan.py
  ✓ static/.gitkeep
  ✓ .env (you must create this)

✓ Client files (client/)
  ✓ package.json
  ✓ app.json
  ✓ app.config.ts
  ✓ tsconfig.json
  ✓ babel.config.js
  ✓ App.tsx
  ✓ src/api.ts
  ✓ src/hooks/useNavigationLoop.ts
  ✓ src/components/PressToTalk.tsx
  ✓ src/components/StatusChip.tsx
  ✓ src/components/InstructionBanner.tsx
  ✓ src/styles/tokens.ts
  ✓ assets/README.md
```

## ✅ Environment Setup

### Server Environment

- [ ] Python 3.9+ installed
- [ ] Virtual environment created (`server/.venv/`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created in `server/` directory
- [ ] All API keys added to `.env`:
  - [ ] `AZURE_OPENAI_ENDPOINT`
  - [ ] `AZURE_OPENAI_API_KEY`
  - [ ] `AZURE_OPENAI_DEPLOYMENT`
  - [ ] `ELEVENLABS_API_KEY`
  - [ ] `ELEVENLABS_VOICE_ID`
  - [ ] `WHISPER_API_KEY`

### Client Environment

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] `SERVER_URL` updated in `app.config.ts` with local IP
- [ ] iOS device with Expo Go installed
- [ ] Device and computer on same WiFi network

## ✅ Server Functionality

Start server: `cd server && source .venv/bin/activate && uvicorn main:app --reload`

- [ ] Server starts without errors
- [ ] Console shows "Loading YOLO model..."
- [ ] Console shows "Server ready!"
- [ ] YOLO model downloaded (check for `yolov8n.pt` file)
- [ ] Can access `http://localhost:8000`
- [ ] Can access API docs at `http://localhost:8000/docs`

### Test Endpoints

- [ ] GET `/` returns status OK
- [ ] POST `/tts` returns URL for MP3 file
- [ ] MP3 file can be downloaded from `/static/...`
- [ ] POST `/detect` with test image returns detections
- [ ] POST `/plan` returns navigation instruction
- [ ] POST `/stt` with audio file returns transcript

See [API_TESTING.md](API_TESTING.md) for detailed testing commands.

## ✅ Client Functionality

Start client: `cd client && npm start`

- [ ] Expo dev server starts
- [ ] QR code displayed
- [ ] Can scan QR code with Expo Go
- [ ] App loads on device

### Initial Launch

- [ ] Camera permission prompt appears
- [ ] Microphone permission prompt appears
- [ ] After granting permissions, camera preview appears
- [ ] Hears: "Hi, I'm Seer. Say a checkpoint."
- [ ] Status chip shows "Ready"
- [ ] Large circular button visible at bottom

## ✅ Acceptance Criteria

### 1. App Launch & Permissions

- [ ] App launches without crashes
- [ ] Requests camera and microphone permissions
- [ ] Shows permission error if denied
- [ ] Announces welcome message: "Hi, I'm Seer. Say a checkpoint."

### 2. Voice Input & Checkpoint Setting

- [ ] Press-and-hold button starts recording
- [ ] Button changes appearance when pressed
- [ ] "Recording..." text appears
- [ ] Release sends audio to server
- [ ] Transcript appears in logs
- [ ] Speech becomes text via `/stt` endpoint
- [ ] Checkpoint is saved
- [ ] Status changes to "Guiding..."

### 3. Navigation Loop

- [ ] While navigating, frame captured every ~1.2s
- [ ] Each frame sent to `/detect` endpoint
- [ ] Detections sent to `/plan` endpoint
- [ ] Instruction returned from `/plan`
- [ ] Instruction sent to `/tts` endpoint
- [ ] Audio plays from phone speaker
- [ ] Instruction banner updates with text
- [ ] No overlapping cycles (waits for current cycle)

### 4. Voice Commands During Navigation

- [ ] "repeat" command plays last instruction again
- [ ] "stop" command ends navigation
- [ ] "new checkpoint [name]" changes destination
- [ ] "I'm here" marks checkpoint as reached

### 5. Haptic Feedback

- [ ] Haptic on button press (start recording)
- [ ] Haptic on button release (stop recording)
- [ ] Haptic when instruction plays
- [ ] Success haptic when checkpoint reached
- [ ] Warning haptic for pause/obstacle instructions

### 6. Reached State

- [ ] When `/plan` returns `reached: true`, state changes
- [ ] Status chip shows "Reached!"
- [ ] Success haptic triggers
- [ ] Announces "You've reached [checkpoint]."
- [ ] Navigation loop stops
- [ ] Can set new checkpoint

### 7. Error Handling

- [ ] Network errors trigger "Network error" TTS
- [ ] Errors logged to console
- [ ] App doesn't crash on network failure
- [ ] Graceful degradation if frame capture fails

### 8. Accessibility Features

- [ ] Button has `accessibilityRole="button"`
- [ ] Button has `accessibilityLabel`
- [ ] Button has large touch target (280x280)
- [ ] Status chip has accessibility label
- [ ] Instruction banner has `accessibilityLiveRegion`
- [ ] All text readable (contrast, size)

## ✅ Performance Checks

- [ ] Frame processing completes in < 3 seconds
- [ ] No visible lag in UI
- [ ] Audio playback is clear
- [ ] No memory leaks during extended use
- [ ] Battery usage reasonable

## ✅ Code Quality

### Server

- [ ] All imports resolve
- [ ] No Python syntax errors
- [ ] Environment variables loaded correctly
- [ ] Error handling present in all endpoints
- [ ] CORS enabled for Expo

### Client

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] No linter errors
- [ ] All imports resolve
- [ ] Zod schemas validate API responses
- [ ] Strict mode enabled

## 🎯 Demo Scenario (90 seconds)

Run through the full demo from [README.md](README.md):

- [ ] Launch app (15s)
- [ ] Set checkpoint "elevator" (10s)
- [ ] Navigate with instructions (30s)
- [ ] Change to "exit" (15s)
- [ ] Test "repeat" command (10s)
- [ ] Say "I'm here" (5s)
- [ ] Stop navigation (5s)

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Network error" repeated | Update `SERVER_URL` in `app.config.ts` to local IP |
| No camera preview | Grant permissions in iOS Settings → Expo Go |
| Audio doesn't play | Check mute switch, grant mic permissions |
| YOLO download fails | Ensure internet connection, check firewall |
| Azure OpenAI timeout | Verify endpoint, API key, deployment name |
| Module not found (Python) | Activate venv: `source .venv/bin/activate` |
| TypeScript errors | Install dependencies: `npm install` |

## 📊 Success Metrics

After completing this checklist, you should have:

1. ✅ Working server with all 4 endpoints responding
2. ✅ Working client app running on iOS device
3. ✅ Complete voice-to-navigation pipeline
4. ✅ Haptic feedback on key interactions
5. ✅ Accessible UI with large touch targets
6. ✅ Error handling for network issues
7. ✅ State machine transitioning correctly
8. ✅ Clean logs with no critical errors

## 🚀 Next Steps

Once everything works:

1. [ ] Test in different environments (indoor, outdoor)
2. [ ] Test with different checkpoints
3. [ ] Test with multiple users
4. [ ] Gather feedback on instruction quality
5. [ ] Optimize performance (latency, accuracy)
6. [ ] Add custom features (see [CONTRIBUTING.md](CONTRIBUTING.md))

---

**Need help?** Check:
- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [API_TESTING.md](API_TESTING.md) - API testing guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guide

Happy navigating! 🎯

