import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "petmood_language";

const SUPPORTED_LANGUAGES: Language[] = ["en", "ko", "ja", "zh", "es", "fr", "de", "pt"];

const getDeviceLanguage = (): Language => {
  if (typeof navigator === 'undefined') return "en";

  // Get browser language (e.g. "en-US", "ko-KR", "zh-CN")
  const browserLang = navigator.language;
  const majorLang = browserLang.split("-")[0]; // "en", "ko", "zh"

  // Special handling for Chinese (Simplified vs Traditional if we supported it, but for now just 'zh')
  // or specific mappings.

  if (SUPPORTED_LANGUAGES.includes(majorLang as Language)) {
    return majorLang as Language;
  }

  return "en";
};

const getSavedLanguage = (): Language | null => {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && SUPPORTED_LANGUAGES.includes(saved as Language)) {
    return saved as Language;
  }
  return null;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = getSavedLanguage();
    return saved || getDeviceLanguage();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  // NEW: Location-based detection
  const detectLocationLanguage = async () => {
    try {
      // 1. Check permissions (or just try getting position)
      // For web/hybrid, we might need to be careful about permissions prompts blocking startup.
      // We'll try this asynchronously and update if successful.

      const { Geolocation } = await import('@capacitor/geolocation');

      const hasPermission = await Geolocation.checkPermissions();
      if (hasPermission.location !== 'granted') {
        // Optionally request if we really want to force it, but for UX on startup, 
        // maybe just return if not already granted or attempt once.
        // Let's try attempting request.
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 3600000 // 1 hour cached
      });

      const { latitude, longitude } = position.coords;

      // 2. Reverse Geocode (free API)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (!response.ok) return;

      const data = await response.json();
      const countryCode = data.countryCode; // "US", "KR", "JP", etc.

      // 3. Map to Language
      let detectedLang: Language | null = null;
      switch (countryCode) {
        case 'KR': detectedLang = 'ko'; break;
        case 'JP': detectedLang = 'ja'; break;
        case 'CN': detectedLang = 'zh'; break; // Simplified/Traditional handling omitted for now
        case 'ES': detectedLang = 'es'; break;
        case 'FR': detectedLang = 'fr'; break;
        case 'DE': detectedLang = 'de'; break;
        case 'PT':
        case 'BR': detectedLang = 'pt'; break;
        case 'US':
        case 'GB':
        case 'AU':
        case 'CA': detectedLang = 'en'; break;
        default:
          // If we have other mappings or fallback to 'en'
          break;
      }

      if (detectedLang && SUPPORTED_LANGUAGES.includes(detectedLang)) {
        // Only update if no manual override exists? 
        // OR always update on first install?
        // Current logic: `useState` initialized from storage or device.
        // If we want to OVERRIDE device default but allow manual storage save, we should check if storage is empty.

        if (!localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
          setLanguage(detectedLang);
        }
      }

    } catch (error) {
      console.warn("Location language detection failed:", error);
    }
  };

  useEffect(() => {
    // Attempt detection on mount if no language is manually saved
    if (!localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
      detectLocationLanguage();
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
