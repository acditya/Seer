"""
Seer Flask server.
Provides endpoints for STT, TTS, object detection, and navigation planning.
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from stt import transcribe_audio
from tts import synthesize_speech, STATIC_DIR
from plan import generate_instruction
from state import update_scene, get_scene, clear_scene

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

print("✅ Seer server ready! Using OpenAI for everything.")


# ============================================================================
# Routes
# ============================================================================

@app.route('/', methods=['GET'])
def root():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "message": "Seer API - OpenAI powered vision navigation",
        "endpoints": ["/stt", "/tts", "/plan", "/scene"],
        "powered_by": "OpenAI (Whisper + GPT-4o-mini Vision)"
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
    Return text for client-side iOS TTS.
    
    Expects:
        JSON: {"text": "text to speak"}
        
    Returns:
        JSON: {"text": "same text for iOS to speak"}
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        
        # Just pass through - client handles TTS
        result_text = synthesize_speech(text)
        
        return jsonify({"text": result_text})
    
    except Exception as e:
        print(f"TTS error: {e}")
        return jsonify({"error": f"Text-to-speech failed: {str(e)}"}), 500


@app.route('/plan', methods=['POST'])
def plan_navigation():
    """
    Generate navigation instruction using GPT-4o-mini vision.
    
    Expects:
        Form data with:
            - checkpoint (str)
            - detections (JSON string)
            - recent_instructions (JSON string)
            - history_snippets (JSON string)
            - image (file, optional) - camera frame for vision analysis
        
    Returns:
        JSON: {
            "instruction": str,
            "urgency": str,
            "reached": bool,
            "danger_level": str
        }
    """
    try:
        # Check if multipart (with image) or JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Multipart: image + data
            checkpoint = request.form.get('checkpoint')
            detections = json.loads(request.form.get('detections', '[]'))
            recent_instructions = json.loads(request.form.get('recent_instructions', '[]'))
            history_snippets = json.loads(request.form.get('history_snippets', '[]'))
            
            # Get image if provided
            image_bytes = None
            if 'image' in request.files:
                image_file = request.files['image']
                image_bytes = image_file.read()
                print(f"📸 Received image: {len(image_bytes)} bytes")
        else:
            # JSON only (no image)
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            checkpoint = data.get('checkpoint')
            detections = data.get('detections', [])
            recent_instructions = data.get('recent_instructions', [])
            history_snippets = data.get('history_snippets', [])
            image_bytes = None
        
        if not checkpoint:
            return jsonify({"error": "No checkpoint provided"}), 400
        
        # Generate instruction (with vision if image provided)
        result = generate_instruction(
            checkpoint=checkpoint,
            detections=detections,
            recent_instructions=recent_instructions,
            history_snippets=history_snippets,
            image_bytes=image_bytes
        )
        
        # Update server state
        update_scene(checkpoint, detections, result)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Planning error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Navigation planning failed: {str(e)}"}), 500


@app.route('/scene', methods=['GET'])
def get_current_scene():
    """Get current scene state from server."""
    return jsonify(get_scene())


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files (MP3 audio files)."""
    print(f"📡 Serving static file: {filename}")
    response = send_from_directory(str(STATIC_DIR), filename)
    response.headers['Content-Type'] = 'audio/mpeg'
    return response


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
