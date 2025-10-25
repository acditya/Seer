"""
Navigation planning with depth estimation and spatial awareness.
"""

import os
import json
import base64
from typing import List, Dict, Any, Optional
from openai import OpenAI, AzureOpenAI


# Simple, direct prompt for GPT-4o vision
SYSTEM_PROMPT = """You are Seer, a navigation guide for visually impaired users.

You see through their camera and guide them to their destination.

Rules:
- SHORT instructions: 10-15 words max (5-7 seconds)
- FIRST time seeing destination: Confirm it! "The door! I see it. Let's go."
- During navigation: Guide based on what you SEE in the image
- Warn about obstacles FIRST: "Stop. Chair ahead on right."
- When at destination: "You're here! The door is right in front of you." (reached: true)

Examples:
- User says "the door", you see a door → "The door! I see it straight ahead." (normal)
- Clear path to door → "Clear ahead. Walk forward five steps." (normal)
- Chair blocking path → "Stop. Chair two feet ahead. Step left." (warning)
- Door very close → "Almost there! Door right in front." (reached: true)
- At destination → "You're here! The door is in front of you." (reached: true)

Output JSON:
{
  "instruction": "short guidance",
  "urgency": "normal or warning",
  "reached": true/false,
  "danger_level": "safe or caution or danger"
}
"""


def estimate_depth_and_position(detection: Dict, img_w: int, img_h: int) -> Dict:
    """
    Estimate distance and position from bounding box.
    
    Simple heuristics:
    - Vertical position: Lower in frame = closer
    - Box size: Larger relative to frame = closer
    - Horizontal position: Left/center/right
    
    Args:
        detection: YOLO detection with xywh
        img_w: Image width
        img_h: Image height
        
    Returns:
        Enhanced detection with distance and position
    """
    cx, cy, w, h = detection["xywh"]
    
    # Estimate distance (rough approximation)
    # Objects lower in frame and larger are closer
    vertical_ratio = cy / img_h  # 0 = top, 1 = bottom
    size_ratio = (w * h) / (img_w * img_h)  # How much of frame it occupies
    
    # Distance estimation (feet)
    # Lower + larger = closer
    if vertical_ratio > 0.7 and size_ratio > 0.1:
        distance = "1-2 feet"
        distance_value = 1.5
    elif vertical_ratio > 0.6 and size_ratio > 0.05:
        distance = "2-4 feet"
        distance_value = 3
    elif vertical_ratio > 0.5:
        distance = "4-6 feet"
        distance_value = 5
    elif vertical_ratio > 0.4:
        distance = "6-10 feet"
        distance_value = 8
    else:
        distance = "10+ feet"
        distance_value = 12
    
    # Horizontal position
    horizontal_ratio = cx / img_w
    if horizontal_ratio < 0.33:
        position = "left"
    elif horizontal_ratio > 0.67:
        position = "right"
    else:
        position = "center"
    
    # Is this a direct obstacle? (center + close)
    is_obstacle = position == "center" and distance_value < 4
    
    return {
        "object": detection["cls"],
        "confidence": detection["conf"],
        "distance": distance,
        "distance_feet": distance_value,
        "position": position,
        "is_direct_obstacle": is_obstacle,
        "raw_xywh": detection["xywh"]
    }


def create_planning_client():
    """Create OpenAI/Azure OpenAI client."""
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    azure_key = os.getenv("AZURE_OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_KEY")
    api_version = os.getenv("AZURE_OPENAI_VERSION", "2024-02-15-preview")
    
    if azure_endpoint and azure_key:
        return AzureOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=azure_key,
            api_version=api_version
        )
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Azure OpenAI or OpenAI API key required")
    
    return OpenAI(api_key=api_key)


def generate_instruction(
    checkpoint: str,
    detections: List[Dict[str, Any]],
    recent_instructions: List[str],
    history_snippets: List[str],
    image_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Generate navigation instruction with spatial awareness.
    
    Args:
        checkpoint: Target destination
        detections: Raw YOLO detections
        recent_instructions: Recent navigation history
        history_snippets: Conversation context
        
    Returns:
        Instruction with urgency and spatial info
    """
    # Use standard OpenAI for vision (simpler, always works)
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("OPENAI_API_KEY required for vision")
    
    client = OpenAI(api_key=openai_key)
    model = "gpt-4o-mini"  # Standard OpenAI with vision support
    
    # Call LLM with vision if image provided
    try:
        if image_bytes:
            # Use GPT-4o-mini VISION to see the actual image
            print(f"🔍 Using vision model to analyze image ({len(image_bytes)} bytes)")
            
            # Encode image to base64
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Check if this is the first instruction (confirming destination)
            is_first = not recent_instructions or len(recent_instructions) == 0
            
            if is_first:
                user_message = f"""I want to go to: {checkpoint}

Look at the image. Do you see {checkpoint}?

If you see it: Confirm enthusiastically! "The {checkpoint}! I see it."
If you don't: "I don't see {checkpoint} yet. Describe what's ahead."

SHORT response (10-15 words). JSON format."""
            else:
                user_message = f"""I'm navigating to: {checkpoint}

Look at the camera. What do you see?
- Any obstacles in my path?
- Clear to move forward?
- How close am I to {checkpoint}?

Recent: {recent_instructions[-2:]}

Guide me. SHORT (10-15 words). JSON format."""

            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_message},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_b64}",
                                    "detail": "low"  # Faster processing
                                }
                            }
                        ]
                    }
                ],
                temperature=0.3,
                max_tokens=150,
                response_format={"type": "json_object"}
            )
        else:
            # Fallback: Use YOLO detections only
            print(f"⚠️ No image provided, using YOLO detections only")
            
            img_w = 1280
            img_h = 720
            
            enhanced_detections = [
                estimate_depth_and_position(det, img_w, img_h) 
                for det in detections
            ]
            enhanced_detections.sort(key=lambda x: x["distance_feet"])
            
            scene_description = []
            for det in enhanced_detections[:5]:
                desc = f"- {det['object']}: {det['distance']} away, {det['position']} side"
                if det['is_direct_obstacle']:
                    desc += " ⚠️ BLOCKING PATH"
                scene_description.append(desc)
            
            user_message = f"""Target: {checkpoint}

Scene: {chr(10).join(scene_description) if scene_description else "Clear path"}

Recent: {recent_instructions[-3:] if recent_instructions else ["Starting"]}

JSON instruction:"""

            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=150,
                response_format={"type": "json_object"}
            )
        
        result = json.loads(response.choices[0].message.content)
        
        return {
            "instruction": result.get("instruction", "Continue forward."),
            "urgency": result.get("urgency", "normal"),
            "reached": result.get("reached", False),
            "danger_level": result.get("danger_level", "safe")
        }
        
    except Exception as e:
        print(f"Planning error: {e}")
        # Fallback instruction
        return {
            "instruction": "Continue forward carefully.",
            "urgency": "normal",
            "reached": False,
            "reason": f"Error: {str(e)}",
            "danger_level": "safe"
        }
