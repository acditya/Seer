/**
 * Seer - Voice-first navigation helper for visually impaired users.
 * Main app component with camera, voice input, and navigation loop.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import PressToTalk from './src/components/PressToTalk';
import StatusChip from './src/components/StatusChip';
import InstructionBanner from './src/components/InstructionBanner';
import { useNavigationLoop } from './src/hooks/useNavigationLoop';
import { colors, spacing } from './src/styles/tokens';

export default function App() {
  // Permissions
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);

  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Navigation state
  const {
    state,
    status,
    checkpoint,
    lastInstruction,
    lastUrgency,
    handleVoiceInput,
    handleFrameCapture,
    isProcessing,
  } = useNavigationLoop();

  /**
   * Handle press-to-talk: Capture frame + process voice.
   */
  const handleButtonPress = async (audioUri: string) => {
    // First, process voice input
    await handleVoiceInput(audioUri);
    
    // Then, if navigating, capture and analyze a frame
    if (state === 'NAVIGATING' && checkpoint && cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
        
        if (photo?.uri) {
          console.log('Frame captured:', photo.uri);
          await handleFrameCapture(photo.uri);
        }
      } catch (error) {
        console.error('Frame capture error:', error);
      }
    }
  };

  /**
   * Request permissions on mount.
   */
  useEffect(() => {
    (async () => {
      // Request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      // Request audio permission
      const audioStatus = await Audio.requestPermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');

      // Keep screen awake during navigation
      activateKeepAwakeAsync();
    })();

    return () => {
      deactivateKeepAwake();
    };
  }, []);

  /**
   * Continuous guidance: Auto-capture every 5 seconds while navigating
   */
  useEffect(() => {
    if (state === 'NAVIGATING' && checkpoint) {
      console.log('🔄 Starting continuous guidance (5s intervals)...');

      const interval = setInterval(async () => {
        if (cameraRef.current && !isProcessing) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.5,
              skipProcessing: true,
            });

            if (photo?.uri) {
              console.log('📸 Auto-captured frame:', photo.uri);
              await handleFrameCapture(photo.uri);
            }
          } catch (error) {
            console.error('Auto-capture error:', error);
          }
        }
      }, 5000); // Every 5 seconds

      return () => {
        console.log('⏹️ Stopping continuous guidance');
        clearInterval(interval);
      };
    }
  }, [state, checkpoint, isProcessing, handleFrameCapture]);

  /**
   * Show permission alerts if needed.
   */
  useEffect(() => {
    if (hasCameraPermission === false) {
      Alert.alert(
        'Camera Permission Required',
        'Seer needs camera access to detect objects and guide you.',
        [{ text: 'OK' }]
      );
    }
    if (hasAudioPermission === false) {
      Alert.alert(
        'Microphone Permission Required',
        'Seer needs microphone access to understand your voice commands.',
        [{ text: 'OK' }]
      );
    }
  }, [hasCameraPermission, hasAudioPermission]);

  /**
   * Loading state while checking permissions.
   */
  if (hasCameraPermission === null || hasAudioPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing Seer...</Text>
      </View>
    );
  }

  /**
   * Permission denied state.
   */
  if (hasCameraPermission === false || hasAudioPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>❌ Permissions Required</Text>
        <Text style={styles.errorSubtext}>
          Please grant camera and microphone access in Settings.
        </Text>
      </View>
    );
  }

  /**
   * Main app UI.
   */
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Camera preview (fullscreen background) */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      />

      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay}>
        {/* Top section: Status chip */}
        <View style={styles.topSection}>
          <StatusChip status={status} />
        </View>

        {/* Middle section: Instruction banner */}
        <View style={styles.middleSection}>
          <InstructionBanner
            instruction={lastInstruction}
            urgency={lastUrgency}
          />
        </View>

        {/* Bottom section: Press-to-talk button */}
        <View style={styles.bottomSection}>
          <PressToTalk
            onTranscript={handleButtonPress}
            disabled={isProcessing}
          />
          
          {checkpoint && (
            <View style={styles.checkpointBadge}>
              <Text style={styles.checkpointText}>📍 {checkpoint}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayLight,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  checkpointBadge: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  checkpointText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 24,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorSubtext: {
    fontSize: 16,
    color: colors.gray300,
    textAlign: 'center',
  },
});

