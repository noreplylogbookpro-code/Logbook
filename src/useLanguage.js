import React, { createContext, useContext, useState, useEffect } from 'react';
import dictionaryData from './dictionary.json';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ur', name: 'اردو (Urdu)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' }
];

export const dictionary = dictionaryData;

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const getInitialLanguage = () => {
    const stored = localStorage.getItem('language');
    const isValid = LANGUAGES.some(l => l.code === stored);
    return isValid ? stored : 'en';
  };

  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (lang) => {
    if (LANGUAGES.some(l => l.code === lang)) {
      setLanguageState(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key) => {
    return dictionary[language]?.[key] || dictionary['en']?.[key] || key;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t, languages: LANGUAGES } },
    children
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
