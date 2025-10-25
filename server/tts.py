"""
Text-to-speech passthrough - just returns text for client-side iOS TTS.
No audio files needed!
"""

from pathlib import Path

# Keep this for compatibility
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)


def synthesize_speech(text: str) -> str:
    """
    Return text as-is for client to speak using iOS TTS.
    No server-side audio generation needed!
    
    Args:
        text: Text to speak
        
    Returns:
        The same text (client will use Expo Speech)
    """
    print(f"🎤 TTS passthrough: '{text[:60]}...'")
    
    # Just return the text - client handles TTS
    return text
