"""
Speech-to-text using OpenAI Whisper API.
Handles M4A files natively!
"""

import os
from io import BytesIO
from openai import OpenAI


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.m4a", language: str = "en") -> str:
    """
    Transcribe audio using OpenAI Whisper API.
    
    Args:
        audio_bytes: Audio file bytes (M4A from iPhone)
        filename: Original filename
        language: ISO language code (e.g., 'en', 'es', 'fr')
        
    Returns:
        Transcribed text
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set in .env!")
    
    client = OpenAI(api_key=api_key)
    
    print(f"🎙️ Transcribing {len(audio_bytes)} bytes with Whisper ({language})...")
    
    # Create file-like object from bytes
    audio_file = BytesIO(audio_bytes)
    audio_file.name = filename  # Whisper needs a filename
    
    try:
        # Call Whisper API (supports M4A natively!)
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language  # Use selected language
        )
        
        transcript = response.text.strip()
        print(f"✅ Whisper: '{transcript}'")
        return transcript
        
    except Exception as e:
        print(f"❌ Whisper error: {e}")
        raise
