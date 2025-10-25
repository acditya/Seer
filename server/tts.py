"""
Text-to-speech using ElevenLabs API.
"""

import os
import uuid
import requests
from pathlib import Path


# Directory for temporary MP3 files
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)


def synthesize_speech(text: str) -> str:
    """
    Convert text to speech using ElevenLabs.
    
    Args:
        text: Text to synthesize
        
    Returns:
        URL path to generated MP3 file (e.g., /static/abc-123.mp3)
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set in environment")
    
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "Rachel")
    
    # ElevenLabs API endpoint
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    # Request TTS
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    # Save to static directory
    filename = f"{uuid.uuid4()}.mp3"
    filepath = STATIC_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(response.content)
    
    # Return URL path
    return f"/static/{filename}"

