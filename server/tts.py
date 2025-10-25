"""
Text-to-speech passthrough - returns text for iOS TTS.
Simpler and more reliable after microphone recording!
"""

from pathlib import Path

# Keep for compatibility
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)


def synthesize_speech(text: str) -> str:
    """
    Return text for iOS to speak.
    
    Args:
        text: Text to speak
        
    Returns:
        Same text (iOS handles TTS)
    """
    print(f"🎤 iOS TTS: '{text[:60]}...'")
    return text
