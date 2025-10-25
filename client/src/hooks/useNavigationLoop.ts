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
import { Language, DEFAULT_LANGUAGE } from '../types/languages';

type NavigationState = 'SELECT_LANGUAGE' | 'ASK_GOAL' | 'NAVIGATING' | 'REACHED' | 'ASK_NEXT' | 'END';

interface UseNavigationLoopReturn {
  state: NavigationState;
  status: StatusType;
  checkpoint: string | null;
  lastInstruction: string | null;
  lastUrgency: 'normal' | 'warning';
  language: Language;
  setLanguage: (language: Language) => void;
  handleVoiceInput: (audioUri: string) => Promise<void>;
  handleFrameCapture: (imageUri: string) => Promise<void>;
  setCheckpoint: (checkpoint: string) => void;
  resetNavigation: () => void;
  isProcessing: boolean;
}

export function useNavigationLoop(): UseNavigationLoopReturn {
  // State
  const [state, setState] = useState<NavigationState>('SELECT_LANGUAGE');
  const [status, setStatus] = useState<StatusType>('idle');
  const [checkpoint, setCheckpointState] = useState<string | null>(null);
  const [lastInstruction, setLastInstruction] = useState<string | null>(null);
  const [lastUrgency, setLastUrgency] = useState<'normal' | 'warning'>('normal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  // History tracking
  const recentInstructions = useRef<string[]>([]);
  const historySnippets = useRef<string[]>([]);

  /**
   * Speak using iOS TTS (more reliable after recording).
   */
  const playTTS = useCallback(async (text: string, urgency: 'normal' | 'warning' = 'normal') => {
    try {
      // Stop any currently speaking
      Speech.stop();

      console.log('Speaking:', text);

      // FORCE SPEAKER OUTPUT (override iOS earpiece routing)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        // FORCE SPEAKER!
        interruptionModeIOS: 2, // DoNotMix
      });

      // Small delay to let audio route switch
      await new Promise(resolve => setTimeout(resolve, 100));

      // Speak using iOS TTS in selected language
      Speech.speak(text, {
        language: language.ttsVoice,
        pitch: 1.0,
        rate: urgency === 'warning' ? 0.85 : 0.95,
        // iOS-specific: force speaker
        _voiceIndex: undefined,
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
      // Transcribe audio in selected language
      const transcript = await postAudio(audioUri, language.whisperCode);
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

      // Plan next instruction (GPT-4o sees the image directly, responds in selected language)
      const planResult = await postPlan(
        checkpoint,
        [],  // No YOLO detections needed!
        recentInstructions.current,
        historySnippets.current,
        imageUri,  // Send camera image to GPT-4o!
        language.whisperCode  // Language for LLM response
      );

      console.log('Plan:', planResult);

      // Haptic feedback based on danger level
      if (planResult.danger_level === 'danger') {
        // Immediate danger - strong warning haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (planResult.danger_level === 'caution') {
        // Caution - medium warning haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (planResult.danger_level === 'safe') {
        // Safe - light feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Play instruction
      await playTTS(planResult.instruction, planResult.urgency as 'normal' | 'warning');

      // Check if reached (LLM says they're RIGHT AT IT)
      if (planResult.reached) {
        console.log('🎯 Destination reached! Stopping continuous guidance.');
        setState('REACHED');
        setStatus('reached');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Don't speak again - LLM already said they reached it
      }
    } catch (error) {
      console.error('Frame processing error:', error);
      // Don't spam errors on every frame - just log and continue
    } finally {
      setIsProcessing(false);
    }
  }, [state, checkpoint, isProcessing, playTTS]);

  /**
   * Set language and move to ASK_GOAL state.
   */
  const setLanguage = useCallback((selectedLanguage: Language) => {
    setLanguageState(selectedLanguage);
    setState('ASK_GOAL');
    console.log(`Language set to: ${selectedLanguage.name}`);
  }, []);

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

  // Configure audio on mount - FORCE SPEAKER ALWAYS!
  useEffect(() => {
    const setupAudio = async () => {
      // ALWAYS use main speaker (never earpiece)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 2, // DoNotMix - forces speaker output
      });
      
      console.log('🔊 Audio configured: SPEAKER mode forced');
    };
    
    setupAudio();
  }, []);

  return {
    state,
    status,
    checkpoint,
    lastInstruction,
    lastUrgency,
    language,
    setLanguage,
    handleVoiceInput,
    handleFrameCapture,
    setCheckpoint,
    resetNavigation,
    isProcessing,
  };
}

