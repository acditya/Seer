"""
Navigation planning using Azure OpenAI.
Generates short, safe instructions based on YOLO detections.
"""

import os
import json
from typing import List, Dict, Any
from openai import OpenAI, AzureOpenAI


# System prompt for Seer navigation (verbatim as specified)
SYSTEM_PROMPT = """You are Seer, a mobility guide for a visually impaired user. You receive YOLO detections and a target checkpoint. Output one short, safe instruction (≤12 words) in plain language. Prefer "slight left/right", "pause", "continue", "step around". If a large obstacle is centered in the lower half, say to pause or step around before any forward motion. Never invent objects. Set reached:true only if the checkpoint clearly appears centered (or recent instructions suggest arrival) OR the user indicated arrival. Keep instruction short and speakable."""

# Few-shot examples (embedded in system prompt)
FEW_SHOT_EXAMPLES = """
Examples:
- Door centered: → "Move forward two steps; door ahead." reached:true
- Person crossing left: → "Pause. Person passing on your left." reached:false
- Clear path: → "Continue straight for three steps." reached:false
"""


def create_planning_client():
    """
    Create OpenAI client from environment variables.
    Supports both Azure OpenAI and standard OpenAI API.
    """
    # Check if using Azure OpenAI
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    azure_key = os.getenv("AZURE_OPENAI_API_KEY")
    
    if azure_endpoint and azure_key:
        # Use Azure OpenAI
        return AzureOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=azure_key,
            api_version="2024-02-15-preview"
        )
    
    # Otherwise use standard OpenAI API
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_API_BASE")  # Optional custom endpoint
    
    if not api_key:
        raise ValueError("Either AZURE_OPENAI credentials or OPENAI_API_KEY must be set")
    
    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url
    
    return OpenAI(**client_kwargs)


def generate_instruction(
    checkpoint: str,
    detections: List[Dict[str, Any]],
    recent_instructions: List[str],
    history_snippets: List[str]
) -> Dict[str, Any]:
    """
    Generate next navigation instruction using Azure OpenAI.
    
    Args:
        checkpoint: Target destination (e.g., "elevator")
        detections: YOLO detections from current frame
        recent_instructions: Last few instructions given
        history_snippets: Conversation history (user/seer exchanges)
        
    Returns:
        Dict with instruction, urgency, reached, reason
    """
    client = create_planning_client()
    
    # Get model/deployment name (works for both Azure and OpenAI)
    model = os.getenv("AZURE_OPENAI_DEPLOYMENT") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Build user message with context
    user_message = f"""Target checkpoint: {checkpoint}

Current detections (YOLO):
{json.dumps(detections, indent=2)}

Recent instructions:
{json.dumps(recent_instructions, indent=2)}

History:
{json.dumps(history_snippets[-5:], indent=2)}

Generate the next instruction as JSON:
{{
  "instruction": "short instruction text",
  "urgency": "normal|warning",
  "reached": false,
  "reason": "brief explanation"
}}"""
    
    # Call OpenAI with low temperature for deterministic output
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT + "\n\n" + FEW_SHOT_EXAMPLES
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        temperature=0.2,
        max_tokens=150,
        response_format={"type": "json_object"}  # Force JSON output
    )
    
    # Parse response
    content = response.choices[0].message.content
    result = json.loads(content)
    
    # Ensure all required fields exist
    return {
        "instruction": result.get("instruction", "Continue forward."),
        "urgency": result.get("urgency", "normal"),
        "reached": result.get("reached", False),
        "reason": result.get("reason", "")
    }

