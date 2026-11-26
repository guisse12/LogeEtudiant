import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './translations/fr';
import en from './translations/en';

export const STORAGE_KEY = '@app_language';
export const DEFAULT_LANGUAGE = 'fr';

export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const translations = {
  fr,
  en,
};

// État en mémoire pour les accès statiques hors composant React
let currentLanguage = DEFAULT_LANGUAGE;
const listeners = new Set();

/**
 * Récupère une valeur imbriquée à partir d'un chemin séparé par des points (ex: "auth.loginTitle")
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Fonction de traduction principale
 * Supporte le fallback automatique vers le français et l'interpolation {key}
 * @param {string} key - Clé de traduction (ex: "auth.loginTitle")
 * @param {object} params - Variables à interpoler (ex: { seconds: 30 })
 * @param {string} [lang] - Langue forcée optionnelle
 * @returns {string}
 */
export function t(key, params = {}, lang = null) {
  const activeLang = lang || currentLanguage;
  const dict = translations[activeLang] || translations[DEFAULT_LANGUAGE];
  const fallbackDict = translations[DEFAULT_LANGUAGE];

  let str = getNestedValue(dict, key);
  if (str === undefined && dict !== fallbackDict) {
    str = getNestedValue(fallbackDict, key);
  }

  if (str === undefined) {
    return key;
  }

  if (typeof str !== 'string') {
    return str;
  }

  // Interpolation {param}
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      const reg = new RegExp(`\\{${paramKey}\\}`, 'g');
      str = str.replace(reg, String(params[paramKey]));
    });
  }

  return str;
}

/**
 * Obtenir la langue actuelle
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Changer la langue globalement et la persister
 */
export async function setLanguage(lang) {
  if (lang !== 'fr' && lang !== 'en') {
    console.warn(`[i18n] Langue non supportée: ${lang}. Repli vers 'fr'.`);
    lang = DEFAULT_LANGUAGE;
  }
  currentLanguage = lang;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    console.error('[i18n] Erreur de sauvegarde AsyncStorage:', err);
  }
  listeners.forEach((cb) => {
    try {
      cb(lang);
    } catch (e) {
      console.error('[i18n] Erreur listener:', e);
    }
  });
}

/**
 * Initialiser la langue depuis AsyncStorage au démarrage
 */
export async function initLanguage() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      currentLanguage = saved;
      return saved;
    }
  } catch (err) {
    console.error('[i18n] Erreur lecture AsyncStorage:', err);
  }
  currentLanguage = DEFAULT_LANGUAGE;
  return DEFAULT_LANGUAGE;
}

// ==========================================
// REACT CONTEXT & HOOKS
// ==========================================

export const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, params) => t(key, params),
  isLoaded: false,
});

/**
 * Fournisseur React de la langue pour toute l'application
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(currentLanguage);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initLanguage().then((lang) => {
      setLanguageState(lang);
      setIsLoaded(true);
    });

    const listener = (newLang) => {
      setLanguageState(newLang);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const changeLanguage = useCallback(async (newLang) => {
    await setLanguage(newLang);
    setLanguageState(newLang);
  }, []);

  const translate = useCallback(
    (key, params) => t(key, params, language),
    [language]
  );

  const value = {
    language,
    setLanguage: changeLanguage,
    t: translate,
    isLoaded,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook personnalisé pour utiliser la traduction et changer de langue dans un composant
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: currentLanguage,
      setLanguage,
      t: (key, params) => t(key, params),
      isLoaded: true,
    };
  }
  return context;
}

export default {
  t,
  getLanguage,
  setLanguage,
  initLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  useTranslation,
  LanguageProvider,
  LanguageContext,
};
