# Seer Architecture

## Checkpoint-Based Navigation Pipeline

### ✅ Current Implementation (Client-Server Architecture)

The app **already uses checkpoint-based processing**:

```
┌─────────────┐
│   iPhone    │
│  (Expo Go)  │
└──────┬──────┘
       │
       │ 1. User says "elevator"
       │    (Audio → Azure Speech)
       ├─────────────────────────►
       │
       │ 2. Every ~1.2s: Capture frame
       │    (Camera → JPEG)
       ├─────────────────────────►
       │                          ┌──────────────┐
       │                          │   Server     │
       │                          │  (Flask)     │
       │                          └──────┬───────┘
       │                                 │
       │                          3. YOLO Detection
       │                          ┌──────▼───────┐
       │                          │  YOLOv8n     │
       │                          │  (Local)     │
       │                          └──────┬───────┘
       │                                 │
       │                          4. AI Planning
       │                          ┌──────▼───────┐
       │                          │ Azure OpenAI │
       │                          │   Reasoning  │
       │                          └──────┬───────┘
       │                                 │
       │ 5. Instruction returned         │
       │    "Walk forward 3 steps"      │
       ◄────────────────────────────────┤
       │
       │ 6. ElevenLabs TTS
       │    (Speaks instruction)
       ├─────────────────────────►
       │                          ┌──────────────┐
       │                          │  ElevenLabs  │
       │                          └──────┬───────┘
       │                                 │
       │ 7. Audio MP3 returned          │
       ◄────────────────────────────────┤
       │
       │ 8. Play audio
       │    📳 Haptic feedback
       │
       │ REPEAT every 1.2s until reached
       │
```

## Key Points

### ✅ Why Client-Server?

1. **YOLO can't run on iOS** - Model requires PyTorch which is too heavy for Expo Go
2. **Server-side processing** - Keeps app lightweight and fast
3. **Centralized AI** - One server can serve multiple clients
4. **Easy updates** - Update server without app rebuild

### ✅ YOLO Model Weights

- **Location**: `server/yolov8n.pt` (already downloaded, ~6MB)
- **Model**: YOLOv8 Nano (fastest, lightest)
- **No re-download needed** - File exists locally
- **One-time load** - Loaded once at server startup, kept in memory

### Navigation Loop (Client)

```typescript
// client/src/hooks/useNavigationLoop.ts

setInterval(async () => {
  if (state === 'NAVIGATING') {
    // 1. Capture frame
    const photo = await camera.takePictureAsync({ quality: 0.5 });
    
    // 2. Send to server for detection
    const detections = await postImage(photo.uri);
    
    // 3. Get AI navigation plan
    const plan = await postPlan(checkpoint, detections);
    
    // 4. Speak instruction
    const audioUrl = await postTTS(plan.instruction);
    await Audio.Sound.createAsync({ uri: audioUrl }).playAsync();
    
    // 5. Check if reached
    if (plan.reached) {
      setState('REACHED');
      Haptics.notificationAsync(Success);
    }
  }
}, 1200); // Every 1.2 seconds
```

### Server Processing (Python)

```python
# server/main.py

@app.route('/detect', methods=['POST'])
def detect_objects():
    image = request.files['image']
    
    # YOLO detection (fast, ~100-300ms)
    detector = get_detector()  # Pre-loaded model
    result = detector.detect(image.read())
    
    return jsonify(result)


@app.route('/plan', methods=['POST'])
def plan_navigation():
    data = request.json
    
    # AI reasoning (fast, ~500-1000ms)
    instruction = generate_instruction(
        checkpoint=data['checkpoint'],
        detections=data['detections']
    )
    
    return jsonify(instruction)
```

## Performance

| Step | Time | Notes |
|------|------|-------|
| Frame capture | ~50ms | Low quality (0.5) for speed |
| Network upload | ~100-200ms | Depends on WiFi |
| YOLO detection | ~100-300ms | Cached model in RAM |
| Azure OpenAI | ~500-1000ms | Reasoning with GPT-4o-mini |
| ElevenLabs TTS | ~500-2000ms | Audio generation |
| Network download | ~100-200ms | Small MP3 file |
| **Total** | **~1.5-3.5s** | Per navigation cycle |

## Checkpointing System

### Checkpoint Definition
A **checkpoint** is a destination landmark: "elevator", "exit", "bathroom", etc.

### State Machine

```
ASK_GOAL
  ↓ (User says "elevator")
NAVIGATING
  ↓ (AI detects elevator centered)
  ↓ OR (User says "I'm here")
REACHED
  ↓ (User says new destination)
NAVIGATING (repeat)
```

### AI Planning Logic

```python
# server/plan.py

def generate_instruction(checkpoint, detections, history):
    prompt = f"""
    Target: {checkpoint}
    
    Current scene:
    - person at (640, 420), conf 0.84
    - chair at (320, 500), conf 0.76
    - door at (800, 300), conf 0.92
    
    Recent instructions:
    - "Continue straight for three steps"
    - "Slight right; chair ahead"
    
    Generate next instruction (≤12 words):
    - If door centered: reached=true
    - If obstacle in path: pause/avoid
    - Otherwise: continue forward
    """
    
    return azure_openai.chat(prompt)
```

## Data Flow

### 1. Voice Input → Checkpoint
```
User: "elevator"
  → Azure Speech STT
  → Text: "elevator"
  → Set checkpoint
  → Start navigation loop
```

### 2. Frame → Detections
```
Camera.takePictureAsync()
  → JPEG bytes
  → POST /detect
  → YOLO inference
  → [{cls: "person", conf: 0.84, xywh: [640,420,200,300]}]
```

### 3. Detections → Instruction
```
POST /plan {
  checkpoint: "elevator",
  detections: [...],
  history: [...]
}
  → Azure OpenAI reasoning
  → {instruction: "Walk forward", reached: false}
```

### 4. Instruction → Speech
```
POST /tts {text: "Walk forward three steps"}
  → ElevenLabs synthesis
  → MP3 bytes
  → /static/abc-123.mp3
  → Play audio + haptic feedback
```

## Security & Trust

### YOLO Model Loading
- **Issue**: PyTorch 2.6 requires `weights_only=True` by default
- **Solution**: Temporarily disable for trusted YOLO weights
- **Safe because**: YOLOv8n.pt is official Ultralytics model

```python
# Temporarily allow for trusted source
torch.serialization.WEIGHTS_ONLY_LOAD_DEFAULT = False
model = YOLO("yolov8n.pt")
torch.serialization.WEIGHTS_ONLY_LOAD_DEFAULT = True
```

## Future Enhancements

### Possible Improvements
1. **Offline mode** - Cache common phrases, local Whisper
2. **Depth sensing** - Use ARKit LiDAR for distance
3. **Indoor mapping** - Build/save floor plans
4. **Multi-user** - Share checkpoints between users
5. **Route optimization** - Learn optimal paths

### Not Currently Implemented
- ❌ On-device YOLO (too slow)
- ❌ Local TTS (quality/consistency)
- ❌ Persistent mapping
- ❌ Multi-checkpoint routing

---

**Current Status**: ✅ Fully functional checkpoint-based navigation with client-server architecture

