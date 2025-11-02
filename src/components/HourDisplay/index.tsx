'use client';

import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';

/**
 * Composant qui affiche l'heure actuelle au format HH:MM:SS
 */
export const HourDisplay: React.FC = () => {
  const [time, setTime] = useState<string>('00:00:00');

  useEffect(() => {
    // Fonction pour formater l'heure
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };

    // Mise à jour immédiate
    updateTime();

    // Mise à jour toutes les secondes
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return <span className={styles.hourDisplay}>{time}</span>;
};

export default HourDisplay;

