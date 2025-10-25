/**
 * API client for Seer backend.
 * Handles all HTTP communication with the FastAPI server.
 */

import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { z } from 'zod';

// Get server URL from app config
const SERVER_URL = Constants.expoConfig?.extra?.serverUrl || 'http://localhost:8000';

console.log('API Server URL:', SERVER_URL);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: SERVER_URL,
  timeout: 30000, // 30s timeout for TTS/STT
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const STTResponseSchema = z.object({
  text: z.string(),
});

const TTSResponseSchema = z.object({
  text: z.string(),
});

const DetectionSchema = z.object({
  cls: z.string(),
  conf: z.number(),
  xywh: z.array(z.number()).length(4),
});

const DetectResponseSchema = z.object({
  img_w: z.number(),
  img_h: z.number(),
  detections: z.array(DetectionSchema),
});

const PlanResponseSchema = z.object({
  instruction: z.string(),
  urgency: z.string(),
  reached: z.boolean(),
  danger_level: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type STTResponse = z.infer<typeof STTResponseSchema>;
export type TTSResponse = z.infer<typeof TTSResponseSchema>;
export type Detection = z.infer<typeof DetectionSchema>;
export type DetectResponse = z.infer<typeof DetectResponseSchema>;
export type PlanResponse = z.infer<typeof PlanResponseSchema>;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Upload audio file for speech-to-text transcription.
 */
export async function postAudio(audioUri: string): Promise<string> {
  try {
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = audioUri.split('/').pop() || 'audio.m4a';
    
    // Append audio file
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: filename,
    } as any);
    
    const response = await api.post('/stt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const validated = STTResponseSchema.parse(response.data);
    return validated.text;
  } catch (error) {
    console.error('STT API error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Upload image file for object detection.
 */
export async function postImage(imageUri: string): Promise<DetectResponse> {
  try {
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';
    
    // Append image file
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);
    
    const response = await api.post('/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const validated = DetectResponseSchema.parse(response.data);
    return validated;
  } catch (error) {
    console.error('Detect API error:', error);
    throw new Error('Failed to detect objects');
  }
}

/**
 * Get text for client-side speech synthesis (iOS TTS).
 */
export async function postTTS(text: string): Promise<string> {
  try {
    const response = await api.post('/tts', { text });
    
    const validated = TTSResponseSchema.parse(response.data);
    
    // Return text for iOS to speak
    return validated.text;
  } catch (error) {
    console.error('TTS API error:', error);
    throw new Error('Failed to get speech text');
  }
}

/**
 * Send navigation planning request with camera image for vision analysis.
 */
export async function postPlan(
  checkpoint: string,
  detections: Detection[],
  recentInstructions: string[] = [],
  historySnippets: string[] = [],
  imageUri?: string
): Promise<PlanResponse> {
  try {
    if (imageUri) {
      // Send with image for GPT-4o vision analysis
      const formData = new FormData();
      formData.append('checkpoint', checkpoint);
      formData.append('detections', JSON.stringify(detections));
      formData.append('recent_instructions', JSON.stringify(recentInstructions));
      formData.append('history_snippets', JSON.stringify(historySnippets));
      
      // Append image
      const filename = imageUri.split('/').pop() || 'frame.jpg';
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      
      const response = await api.post('/plan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const validated = PlanResponseSchema.parse(response.data);
      return validated;
    } else {
      // JSON only (no image)
      const response = await api.post('/plan', {
        checkpoint,
        detections,
        recent_instructions: recentInstructions,
        history_snippets: historySnippets,
      });
      
      const validated = PlanResponseSchema.parse(response.data);
      return validated;
    }
  } catch (error) {
    console.error('Plan API error:', error);
    throw new Error('Failed to generate navigation plan');
  }
}

