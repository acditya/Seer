# Seer API Testing Guide

Quick guide to test the server endpoints before running the full app.

## Prerequisites

Server must be running:
```bash
cd server
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python main.py
```

Server should be available at `http://localhost:8000`

## Manual Testing with cURL

### 1. Health Check

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "status": "ok",
  "message": "Seer API is running",
  "endpoints": ["/stt", "/tts", "/detect", "/plan"]
}
```

### 2. Text-to-Speech (TTS)

```bash
curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Seer"}'
```

Expected response:
```json
{
  "url": "/static/abc-123-def.mp3"
}
```

Play the audio:
```bash
# Download and play
curl http://localhost:8000/static/abc-123-def.mp3 -o test.mp3
open test.mp3  # macOS
# or: start test.mp3  # Windows
```

### 3. Object Detection (YOLO)

Create a test image first, or use any JPEG image:

```bash
curl -X POST http://localhost:8000/detect \
  -F "image=@/path/to/your/image.jpg"
```

Expected response:
```json
{
  "img_w": 1280,
  "img_h": 720,
  "detections": [
    {
      "cls": "person",
      "conf": 0.84,
      "xywh": [640, 420, 200, 300]
    },
    {
      "cls": "chair",
      "conf": 0.76,
      "xywh": [320, 500, 150, 180]
    }
  ]
}
```

### 4. Navigation Planning

```bash
curl -X POST http://localhost:8000/plan \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint": "elevator",
    "detections": [
      {"cls": "person", "conf": 0.84, "xywh": [640, 420, 200, 300]},
      {"cls": "door", "conf": 0.92, "xywh": [800, 300, 100, 250]}
    ],
    "recent_instructions": ["Continue straight"],
    "history_snippets": ["user: elevator"]
  }'
```

Expected response:
```json
{
  "instruction": "Move forward two steps; door ahead.",
  "urgency": "normal",
  "reached": true,
  "reason": "door centered"
}
```

### 5. Speech-to-Text (STT)

Record a short audio clip (m4a or wav) first:

```bash
curl -X POST http://localhost:8000/stt \
  -F "audio=@/path/to/audio.m4a"
```

Expected response:
```json
{
  "text": "elevator"
}
```

## Testing with Python Requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Test TTS
response = requests.post(
    f"{BASE_URL}/tts",
    json={"text": "Walk forward three steps"}
)
print(response.json())

# Test planning
response = requests.post(
    f"{BASE_URL}/plan",
    json={
        "checkpoint": "bathroom",
        "detections": [
            {"cls": "person", "conf": 0.9, "xywh": [640, 400, 200, 300]}
        ],
        "recent_instructions": [],
        "history_snippets": ["user: bathroom"]
    }
)
print(response.json())
```

## Common Issues

### 403 Forbidden / 401 Unauthorized
- Check API keys in `.env` file
- Ensure keys are valid and have proper permissions

### 500 Internal Server Error
- Check server logs for detailed error messages
- Verify all dependencies are installed
- Ensure YOLO model downloaded successfully

### YOLO Detection Fails
- Verify image is valid JPEG
- Check image file size (< 10MB recommended)
- Ensure YOLO model exists in server directory

### Azure OpenAI Timeout
- Check internet connection
- Verify Azure OpenAI endpoint is accessible
- Try reducing temperature or max_tokens in `plan.py`

### ElevenLabs Rate Limit
- Free tier has limited requests per month
- Check your ElevenLabs dashboard for usage
- Consider implementing caching for repeated phrases

## Performance Testing

Test response times:

```bash
# TTS latency
time curl -X POST http://localhost:8000/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Continue straight"}'

# Detection latency
time curl -X POST http://localhost:8000/detect \
  -F "image=@test.jpg"

# Planning latency
time curl -X POST http://localhost:8000/plan \
  -H "Content-Type: application/json" \
  -d '{"checkpoint":"exit","detections":[],"recent_instructions":[],"history_snippets":[]}'
```

Expected latencies:
- TTS: 500-2000ms (depends on ElevenLabs)
- Detection: 100-500ms (depends on image size, hardware)
- Planning: 500-1500ms (depends on Azure OpenAI)

Total frame processing: ~1-3 seconds per cycle

## Next Steps

Once all endpoints work:
1. Test the client app
2. Monitor server logs during app usage
3. Optimize slow endpoints if needed
4. Add caching for common phrases/detections

