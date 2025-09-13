// Supported languages for translation - can be used in client components
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native_name: 'English', flag_emoji: '🇺🇸' },
  { code: 'es', name: 'Spanish', native_name: 'Español', flag_emoji: '🇪🇸' },
  { code: 'fr', name: 'French', native_name: 'Français', flag_emoji: '🇫🇷' },
  { code: 'de', name: 'German', native_name: 'Deutsch', flag_emoji: '🇩🇪' },
  { code: 'it', name: 'Italian', native_name: 'Italiano', flag_emoji: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', native_name: 'Português', flag_emoji: '🇵🇹' },
]

export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES
}