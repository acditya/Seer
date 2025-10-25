/**
 * Navigation loop hook.
 * Manages the state machine for voice-first navigation.
 * 
 * State flow: ASK_GOAL → NAVIGATING → REACHED → ASK_NEXT | END
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { postAudio, postImage, postTTS, postPlan, Detection } from '../api';
import type { StatusType } from '../components/StatusChip';

type NavigationState = 'ASK_GOAL' | 'NAVIGATING' | 'REACHED' | 'ASK_NEXT' | 'END';

interface UseNavigationLoopReturn {
  state: NavigationState;
  status: StatusType;
  checkpoint: string | null;
  lastInstruction: string | null;
  lastUrgency: 'normal' | 'warning';
  handleVoiceInput: (audioUri: string) => Promise<void>;
  handleFrameCapture: (imageUri: string) => Promise<void>;
  setCheckpoint: (checkpoint: string) => void;
  resetNavigation: () => void;
  isProcessing: boolean;
}

export function useNavigationLoop(): UseNavigationLoopReturn {
  // State
  const [state, setState] = useState<NavigationState>('ASK_GOAL');
  const [status, setStatus] = useState<StatusType>('idle');
  const [checkpoint, setCheckpointState] = useState<string | null>(null);
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);
  const [lastUrgency, setLastUrgency] = useState<'normal' | 'warning'>('normal');
  const [isProcessing, setIsProcessing] = useState(false);

  // History tracking
  const recentInstructions = useRef<string[]>([]);
  const historySnippets = useRef<string[]>([]);

  /**
   * Speak text using iOS built-in TTS.
   */
  const playTTS = useCallback(async (text: string, urgency: 'normal' | 'warning' = 'normal') => {
    try {
      // Stop any currently speaking
      Speech.stop();

      // Get text from server (passthrough)
      const speechText = await postTTS(text);
      console.log('Speaking:', speechText);

      // Configure audio to use MAIN SPEAKER (not earpiece!)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Speak using iOS TTS
      Speech.speak(speechText, {
        language: 'en-US',
        pitch: 1.0,
        rate: urgency === 'warning' ? 0.85 : 0.9, // Slightly slower for warnings
      });

      // Update UI
      setLastInstruction(text);
      setLastUrgency(urgency);

      // Haptic feedback
      if (urgency === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Add to history
      recentInstructions.current.push(text);
      if (recentInstructions.current.length > 5) {
        recentInstructions.current.shift();
      }
      historySnippets.current.push(`seer: ${text}`);
    } catch (error) {
      console.error('TTS playback error:', error);
      // Fallback: just show the text
      setLastInstruction(text);
      setLastUrgency(urgency);
    }
  }, []);

  /**
   * Handle voice input (transcribed audio URI).
   */
  const handleVoiceInput = useCallback(async (audioUri: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setStatus('listening');

    try {
      // Transcribe audio
      const transcript = await postAudio(audioUri);
      console.log('Transcript:', transcript);

      historySnippets.current.push(`user: ${transcript}`);

      const lowerTranscript = transcript.toLowerCase();

      // Handle voice commands based on state
      if (state === 'ASK_GOAL' || state === 'ASK_NEXT') {
        // Set new checkpoint silently - LLM will confirm when it sees it!
        setCheckpointState(transcript);
        setState('NAVIGATING');
        setStatus('navigating');
      } else if (state === 'NAVIGATING') {
        // Handle in-navigation commands
        if (lowerTranscript.includes('stop') || lowerTranscript.includes('cancel')) {
          setState('ASK_GOAL');
          setStatus('idle');
          setCheckpointState(null);
          await playTTS('Navigation stopped.');
        } else if (lowerTranscript.includes('repeat')) {
          if (lastInstruction) {
            await playTTS(lastInstruction, lastUrgency);
          }
        } else if (lowerTranscript.includes('new checkpoint')) {
          // Extract checkpoint after "new checkpoint"
          const parts = lowerTranscript.split('new checkpoint');
          if (parts.length > 1) {
            const newCheckpoint = parts[1].trim();
            setCheckpointState(newCheckpoint);
            await playTTS(`Navigating to ${newCheckpoint}.`);
          }
        } else if (lowerTranscript.includes("i'm here") || lowerTranscript.includes('im here')) {
          setState('REACHED');
          setStatus('reached');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await playTTS(`You've reached ${checkpoint}.`);
        }
      } else if (state === 'REACHED') {
        // After reaching, treat input as new checkpoint
        setCheckpointState(transcript);
        setState('NAVIGATING');
        setStatus('navigating');
        await playTTS(`Navigating to ${transcript}.`);
      }
    } catch (error) {
      console.error('Voice input error:', error);
      await playTTS('Network error. Please try again.', 'warning');
    } finally {
      setIsProcessing(false);
      if (state === 'NAVIGATING') {
        setStatus('navigating');
      } else {
        setStatus('idle');
      }
    }
  }, [state, checkpoint, lastInstruction, lastUrgency, isProcessing, playTTS]);

  /**
   * Handle frame capture during navigation.
   */
  const handleFrameCapture = useCallback(async (imageUri: string) => {
    if (state !== 'NAVIGATING' || !checkpoint || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Skip YOLO - just send image directly to GPT-4o vision!
      console.log('Analyzing scene with GPT-4o vision...');

      // Plan next instruction (GPT-4o sees the image directly)
      const planResult = await postPlan(
        checkpoint,
        [],  // No YOLO detections needed!
        recentInstructions.current,
        historySnippets.current,
        imageUri  // Send camera image to GPT-4o!
      );

      console.log('Plan:', planResult);

      // Play instruction
      await playTTS(planResult.instruction, planResult.urgency as 'normal' | 'warning');

      // Check if reached
      if (planResult.reached) {
        setState('REACHED');
        setStatus('reached');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await playTTS(`You've reached ${checkpoint}.`);
      }
    } catch (error) {
      console.error('Frame processing error:', error);
      // Don't spam errors on every frame - just log and continue
    } finally {
      setIsProcessing(false);
    }
  }, [state, checkpoint, isProcessing, playTTS]);

  /**
   * Set checkpoint and start navigating.
   */
  const setCheckpoint = useCallback((newCheckpoint: string) => {
    setCheckpointState(newCheckpoint);
    setState('NAVIGATING');
    setStatus('navigating');
    playTTS(`Navigating to ${newCheckpoint}.`);
  }, [playTTS]);

  /**
   * Reset navigation state.
   */
  const resetNavigation = useCallback(() => {
    setState('ASK_GOAL');
    setStatus('idle');
    setCheckpointState(null);
    setLastInstruction(null);
    recentInstructions.current = [];
    historySnippets.current = [];
  }, []);

  // Configure audio and speak welcome message on mount
  useEffect(() => {
    const setupAudio = async () => {
      // Force main speaker (not earpiece)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      playTTS("Hi, I'm Seer. Say a checkpoint.");
    };
    
    setupAudio();
  }, [playTTS]);

  return {
    state,
    status,
    checkpoint,
    lastInstruction,
    lastUrgency,
    handleVoiceInput,
    handleFrameCapture,
    setCheckpoint,
    resetNavigation,
    isProcessing,
  };
}

