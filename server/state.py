"""
Server-side state management.
Tracks scene context and danger awareness.
"""

from typing import List, Dict, Any
from datetime import datetime

# Global state (in-memory, simple)
_scene_state = {
    "last_checkpoint": None,
    "last_detections": [],
    "last_analysis": None,
    "danger_level": "safe",  # safe, caution, danger
    "timestamp": None,
    "obstacles_ahead": [],
}


def update_scene(checkpoint: str, detections: List[Dict], analysis: Dict):
    """Update global scene state."""
    global _scene_state
    _scene_state = {
        "last_checkpoint": checkpoint,
        "last_detections": detections,
        "last_analysis": analysis,
        "danger_level": analysis.get("danger_level", "safe"),
        "timestamp": datetime.now(),
        "obstacles_ahead": [d for d in detections if d.get("is_direct_obstacle")],
    }


def get_scene():
    """Get current scene state."""
    return _scene_state


def clear_scene():
    """Reset scene state."""
    global _scene_state
    _scene_state = {
        "last_checkpoint": None,
        "last_detections": [],
        "last_analysis": None,
        "danger_level": "safe",
        "timestamp": None,
        "obstacles_ahead": [],
    }

