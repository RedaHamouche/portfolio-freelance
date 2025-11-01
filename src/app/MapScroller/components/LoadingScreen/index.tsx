import React from 'react';
import styles from '../../index.module.scss';

export const LoadingScreen: React.FC = () => {
  return (
    <div className={styles.main}>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Chargement de la carte...
      </div>
    </div>
  );
};

