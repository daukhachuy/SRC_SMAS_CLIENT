import React, { createContext, useContext, useEffect, useState } from 'react';
import messages from '../i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('lang') || 'vi';
    } catch (e) {
      return 'vi';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('lang', lang); } catch(e) {}
  }, [lang]);

  const t = (key) => {
    const seg = key.split('.');
    let val = messages[lang] || {};
    for (const s of seg) { val = val?.[s]; if (!val) break; }
    return val ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(){
  return useContext(LanguageContext);
}
