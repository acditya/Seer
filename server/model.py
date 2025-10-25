"""
YOLO model loader and inference.
Loads YOLOv8 once at startup for fast inference.
"""

import os
from typing import List, Dict, Any
from ultralytics import YOLO
import numpy as np
from PIL import Image
import io


class YOLODetector:
    """Wrapper for YOLO object detection."""
    
    def __init__(self, model_name: str = "yolov8n.pt"):
        """
        Initialize YOLO model.
        
        Args:
            model_name: YOLO model file (downloads if not present)
        """
        print(f"Loading YOLO model: {model_name}")
        self.model = YOLO(model_name)
        print("YOLO model loaded successfully")
    
    def detect(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Run object detection on image.
        
        Args:
            image_bytes: JPEG image bytes
            
        Returns:
            Dict with img_w, img_h, and detections array
        """
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        img_w, img_h = image.size
        
        # Run inference
        results = self.model(image, verbose=False)
        
        # Parse detections
        detections = []
        for result in results:
            boxes = result.boxes
            for i in range(len(boxes)):
                # Get box coordinates (xyxy format)
                box = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = box
                
                # Convert to center + width/height
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2
                w = x2 - x1
                h = y2 - y1
                
                # Get class and confidence
                cls_id = int(boxes.cls[i].cpu().numpy())
                conf = float(boxes.conf[i].cpu().numpy())
                cls_name = self.model.names[cls_id]
                
                detections.append({
                    "cls": cls_name,
                    "conf": round(conf, 2),
                    "xywh": [
                        round(cx, 1),
                        round(cy, 1),
                        round(w, 1),
                        round(h, 1)
                    ]
                })
        
        return {
            "img_w": img_w,
            "img_h": img_h,
            "detections": detections
        }


# Global instance (loaded once at startup)
_detector = None

def get_detector() -> YOLODetector:
    """Get or create global YOLO detector instance."""
    global _detector
    if _detector is None:
        model_name = os.getenv("YOLO_MODEL", "yolov8n.pt")
        _detector = YOLODetector(model_name)
    return _detector

