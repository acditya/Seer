/**
 * PressToTalk component.
 * Press-and-hold button to record audio, release to send for transcription.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows, hitSlop } from '../styles/tokens';

interface PressToTalkProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function PressToTalk({ onTranscript, disabled = false }: PressToTalkProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Microphone permission not granted');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsPressed(true);
      
      // Strong haptic feedback on recording start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Animate button press
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsPressed(false);

      // Animate button release
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Stop recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // CRITICAL: Force audio route to MAIN SPEAKER (not earpiece!)
      // iOS defaults to earpiece after recording - we must override it
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 2, // DoNotMix - forces speaker
      });

      // Extra delay to ensure audio route switches
      await new Promise(resolve => setTimeout(resolve, 150));

      console.log('Recording stopped:', uri);

      // Medium haptic feedback on recording stop
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Send to parent for transcription
      if (uri) {
        onTranscript(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Pressable
          onPressIn={disabled ? undefined : startRecording}
          onPressOut={disabled ? undefined : stopRecording}
          disabled={disabled}
          style={({ pressed }) => [
            styles.button,
            isPressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Press and hold to speak"
          accessibilityHint="Hold down to record your voice command, release to send"
          hitSlop={hitSlop}
        >
          <Text style={styles.buttonText}>
            {isPressed ? '🎤 Recording...' : '🎤 Press to Talk'}
          </Text>
        </Pressable>
      </Animated.View>
      
      {isPressed && (
        <Text style={styles.hint}>Release to send</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonWrapper: {
    width: 280,
    height: 280,
  },
  button: {
    width: '100%',
    height: '100%',
    borderRadius: 140, // Circular
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  buttonPressed: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    backgroundColor: colors.gray500,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.xxl,
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: 'center',
  },
  hint: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.white,
    textAlign: 'center',
  },
});

