"""
Seer Flask server.
Provides endpoints for STT, TTS, object detection, and navigation planning.
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from model import get_detector
from stt import transcribe_audio
from tts import synthesize_speech, STATIC_DIR
from plan import generate_instruction

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Enable CORS for Expo
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max


# Initialize YOLO model at startup
print("Initializing YOLO detector...")
get_detector()
print("Server ready!")


# ============================================================================
# Routes
# ============================================================================

@app.route('/', methods=['GET'])
def root():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "message": "Seer API is running",
        "endpoints": ["/stt", "/tts", "/detect", "/plan"]
    })


@app.route('/stt', methods=['POST'])
def speech_to_text():
    """
    Convert speech to text using Whisper.
    
    Expects:
        audio: Audio file (m4a, wav, etc.)
        
    Returns:
        JSON: {"text": "transcribed text"}
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Read audio bytes
        audio_bytes = audio_file.read()
        
        # Transcribe
        text = transcribe_audio(audio_bytes, audio_file.filename or "audio.m4a")
        
        return jsonify({"text": text})
    
    except Exception as e:
        print(f"STT error: {e}")
        return jsonify({"error": f"Speech-to-text failed: {str(e)}"}), 500


@app.route('/tts', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech using ElevenLabs.
    
    Expects:
        JSON: {"text": "text to synthesize"}
        
    Returns:
        JSON: {"url": "/static/uuid.mp3"}
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        
        # Synthesize speech
        url = synthesize_speech(text)
        
        return jsonify({"url": url})
    
    except Exception as e:
        print(f"TTS error: {e}")
        return jsonify({"error": f"Text-to-speech failed: {str(e)}"}), 500


@app.route('/detect', methods=['POST'])
def detect_objects():
    """
    Detect objects in image using YOLO.
    
    Expects:
        image: JPEG image file
        
    Returns:
        JSON: {
            "img_w": int,
            "img_h": int,
            "detections": [{"cls": str, "conf": float, "xywh": [x,y,w,h]}]
        }
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Read image bytes
        image_bytes = image_file.read()
        
        # Run detection
        detector = get_detector()
        result = detector.detect(image_bytes)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Detection error: {e}")
        return jsonify({"error": f"Object detection failed: {str(e)}"}), 500


@app.route('/plan', methods=['POST'])
def plan_navigation():
    """
    Generate navigation instruction using OpenAI.
    
    Expects:
        JSON: {
            "checkpoint": str,
            "detections": list,
            "recent_instructions": list,
            "history_snippets": list
        }
        
    Returns:
        JSON: {
            "instruction": str,
            "urgency": str,
            "reached": bool,
            "reason": str
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        checkpoint = data.get('checkpoint')
        detections = data.get('detections', [])
        recent_instructions = data.get('recent_instructions', [])
        history_snippets = data.get('history_snippets', [])
        
        if not checkpoint:
            return jsonify({"error": "No checkpoint provided"}), 400
        
        # Generate instruction
        result = generate_instruction(
            checkpoint=checkpoint,
            detections=detections,
            recent_instructions=recent_instructions,
            history_snippets=history_snippets
        )
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Planning error: {e}")
        return jsonify({"error": f"Navigation planning failed: {str(e)}"}), 500


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (MP3 audio files)."""
    return send_from_directory(str(STATIC_DIR), filename)


# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    print(f"\n🔮 Starting Seer server on http://0.0.0.0:{port}")
    print(f"📖 API endpoints: http://localhost:{port}/")
    print(f"Press Ctrl+C to stop\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )
