/**
 * Supported languages with OpenAI suite
 */

export interface Language {
  code: string;
  name: string;
  flag: string;
  whisperCode: string;
  ttsVoice: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', whisperCode: 'en', ttsVoice: 'en-US' },
  { code: 'es', name: 'Español', flag: '🇪🇸', whisperCode: 'es', ttsVoice: 'es-ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', whisperCode: 'fr', ttsVoice: 'fr-FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', whisperCode: 'de', ttsVoice: 'de-DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', whisperCode: 'it', ttsVoice: 'it-IT' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', whisperCode: 'pt', ttsVoice: 'pt-BR' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', whisperCode: 'hi', ttsVoice: 'hi-IN' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', whisperCode: 'ar', ttsVoice: 'ar-SA' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', whisperCode: 'ru', ttsVoice: 'ru-RU' },
  { code: 'zh', name: '中文', flag: '🇨🇳', whisperCode: 'zh', ttsVoice: 'zh-CN' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', whisperCode: 'ja', ttsVoice: 'ja-JP' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', whisperCode: 'ko', ttsVoice: 'ko-KR' },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0]; // English

