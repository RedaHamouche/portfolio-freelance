'use client';

import React from 'react';
import OpenModalButton from '@/components/OpenModalButton';
import TitleText from '@/components/TitleText';
import styles from './index.module.scss';

const ModalDemo: React.FC = () => {
  return (
    <div className={styles.container}>
      <OpenModalButton />
      <TitleText 
        title="Exemple de titre" 
        text="Ceci est un exemple de texte qui s'affiche à côté du bouton."
      />
    </div>
  );
};

export default ModalDemo;

