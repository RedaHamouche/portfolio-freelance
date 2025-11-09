'use client';

import React, { useState } from 'react';
import styles from './index.module.scss';

/**
 * Composant pour gérer la langue de l'application
 */
export const LanguageManager: React.FC = () => {
  const [language, setLanguage] = useState<string>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'fr' : 'en');
  };

  return (
    <button 
      type="button" 
      className={styles.languageManager}
      onClick={toggleLanguage}
      aria-label="Toggle language"
    >
      {language}
    </button>
  );
};

export default LanguageManager;

