/**
 * StatusChip component.
 * Displays current app state (Listening, Guiding, Paused, etc.)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/tokens';

export type StatusType = 'idle' | 'listening' | 'navigating' | 'paused' | 'reached';

interface StatusChipProps {
  status: StatusType;
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string }> = {
  idle: { label: 'Ready', color: colors.gray500 },
  listening: { label: 'Listening…', color: colors.warning },
  navigating: { label: 'Guiding…', color: colors.success },
  paused: { label: 'Paused', color: colors.warning },
  reached: { label: 'Reached!', color: colors.success },
};

export default function StatusChip({ status }: StatusChipProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.color },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${config.label}`}
    >
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  text: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
    textAlign: 'center',
  },
});

