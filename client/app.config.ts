import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Seer',
  slug: 'seer',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.seer.app',
    infoPlist: {
      NSCameraUsageDescription:
        'Seer uses the camera to detect objects and guide you to your destination.',
      NSMicrophoneUsageDescription:
        'Seer uses the microphone to understand your voice commands.',
    },
  },
  plugins: [],
  extra: {
    // TODO: Update this to your local machine's IP address (not localhost)
    // Find your IP: macOS/Linux: ifconfig | grep inet, Windows: ipconfig
    // Example: http://192.168.1.100:8000
    serverUrl: process.env.SERVER_URL || 'http://localhost:8000',
  },
});

