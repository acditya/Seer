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
    // Server URL - Update this to your computer's IP address
    serverUrl: 'http://10.225.45.156:8000',
  },
});

