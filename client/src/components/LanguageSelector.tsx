/**
 * Language selector modal with flags.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LANGUAGES, Language } from '../types/languages';
import { colors, spacing, typography, shadows } from '../styles/tokens';

interface LanguageSelectorProps {
  visible: boolean;
  onSelectLanguage: (language: Language) => void;
}

export default function LanguageSelector({ visible, onSelectLanguage }: LanguageSelectorProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Choose Your Language</Text>
          <Text style={styles.subtitle}>Select the language for navigation</Text>
          
          <ScrollView style={styles.languageList}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={styles.languageButton}
                onPress={() => onSelectLanguage(language)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${language.name}`}
              >
                <Text style={styles.flag}>{language.flag}</Text>
                <Text style={styles.languageName}>{language.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.gray800,
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...shadows.lg,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.gray300,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  languageList: {
    width: '100%',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray700,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  languageName: {
    fontSize: typography.lg,
    fontWeight: typography.medium,
    color: colors.white,
  },
});

