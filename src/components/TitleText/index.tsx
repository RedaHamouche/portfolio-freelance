'use client';

import React from 'react';
import styles from './index.module.scss';

interface TitleTextProps {
  title?: string;
  text?: string;
}

const TitleText: React.FC<TitleTextProps> = ({ 
  title = 'Titre par défaut',
  text = 'Texte par défaut à afficher dans la modal.'
}) => {
  return (
    <div className={styles.titleText}>
      <h2 id="modal-title" className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
    </div>
  );
};

export default TitleText;

