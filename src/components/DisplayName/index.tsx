'use client';

import React from 'react';
import styles from './index.module.scss';

/**
 * Composant qui affiche le nom "reda hamouche"
 */
export const DisplayName: React.FC = () => {
  return <span className={styles.displayName}>reda hamouche</span>;
};

export default DisplayName;

