// Map of country codes to language codes
const countryToLanguage: Record<string, string> = {
  // English
  US: 'en', GB: 'en', AU: 'en', NZ: 'en', IE: 'en',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es',
  // French
  FR: 'fr', BE: 'fr', LU: 'fr',
  // German
  DE: 'de', AT: 'de', LI: 'de', CH: 'de',
  // Portuguese
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt',
  // Japanese
  JP: 'ja',
  // Korean
  KR: 'ko',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
  // Canadian (default to English, can be overridden)
  CA: 'en',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar',
  // Italian
  IT: 'it', SM: 'it', VA: 'it',
  // Dutch
  NL: 'nl',
  // Polish
  PL: 'pl',
  // Turkish
  TR: 'tr',
  // Hindi
  IN: 'hi',
  // Thai
  TH: 'th',
  // Vietnamese
  VN: 'vi',
  // Indonesian
  ID: 'id',
  // Malay
  MY: 'ms',
  // Filipino
  PH: 'tl',
  // Ukrainian
  UA: 'uk',
  // Czech
  CZ: 'cs',
  // Greek
  GR: 'el',
  // Hungarian
  HU: 'hu',
  // Romanian
  RO: 'ro',
  // Swedish
  SE: 'sv',
  // Norwegian
  NO: 'no',
  // Danish
  DK: 'da',
  // Finnish
  FI: 'fi',
  // Hebrew
  IL: 'he',
};

// Supported languages in the app
const supportedLanguages = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh', 'ru', 'ar', 'it', 'nl', 'pl', 'tr', 'hi', 'th', 'vi', 'id'];

export function detectBrowserLanguage(): string {
  // Get the browser's preferred language
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  
  // Extract the language code (e.g., "en-US" -> "en")
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Return if supported, otherwise default to English
  return supportedLanguages.includes(langCode) ? langCode : 'en';
}

export async function detectCountryFromIP(): Promise<string> {
  try {
    // Use a free IP geolocation API
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    const countryCode = data.country_code;
    
    // Map country to language
    const language = countryToLanguage[countryCode] || 'en';
    return supportedLanguages.includes(language) ? language : 'en';
  } catch (error) {
    console.log('IP detection failed, using browser language');
    return detectBrowserLanguage();
  }
}

export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
    ru: 'Русский',
    ar: 'العربية',
    it: 'Italiano',
    nl: 'Nederlands',
    pl: 'Polski',
    tr: 'Türkçe',
    hi: 'हिन्दी',
    th: 'ไทย',
    vi: 'Tiếng Việt',
    id: 'Bahasa Indonesia',
  };
  return names[code] || code;
}

export function getAllLanguages(): { code: string; name: string }[] {
  return supportedLanguages.map(code => ({
    code,
    name: getLanguageName(code),
  }));
}
