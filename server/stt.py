"""
Speech-to-text using OpenAI Whisper API.
"""

import os
from openai import OpenAI


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.m4a") -> str:
    """
    Transcribe audio using Whisper API.
    
    Args:
        audio_bytes: Audio file bytes (m4a, wav, etc.)
        filename: Original filename (for format detection)
        
    Returns:
        Transcribed text
    """
    api_key = os.getenv("WHISPER_API_KEY")
    if not api_key:
        raise ValueError("WHISPER_API_KEY not set in environment")
    
    client = OpenAI(api_key=api_key)
    
    # Create a file-like object for the API
    audio_file = ("audio.m4a", audio_bytes, "audio/m4a")
    
    # Call Whisper API
    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en"  # Force English for faster processing
    )
    
    return response.text.strip()

