/**
 * InstructionBanner component.
 * Displays the last spoken instruction in large, readable text.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/tokens';

interface InstructionBannerProps {
  instruction: string | null;
  urgency?: 'normal' | 'warning';
}

export default function InstructionBanner({ 
  instruction, 
  urgency = 'normal' 
}: InstructionBannerProps) {
  if (!instruction) {
    return null;
  }
  
  const backgroundColor = urgency === 'warning' ? colors.warning : colors.gray800;
  
  return (
    <View
      style={[styles.container, { backgroundColor }]}
      accessibilityRole="text"
      accessibilityLabel={`Instruction: ${instruction}`}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{instruction}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    minHeight: 80,
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.white,
    textAlign: 'center',
    lineHeight: typography.xl * 1.4,
  },
});

