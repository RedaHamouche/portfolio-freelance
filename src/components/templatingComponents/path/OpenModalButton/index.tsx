'use client';

import React from 'react';
import { useModal } from '@/contexts/ModalContext';
import TitleText from '@/components/templatingComponents/path/TitleText';
import styles from './index.module.scss';

const OpenModalButton: React.FC = () => {
  const { openModal } = useModal();

  const handleClick = () => {
    openModal(
      <TitleText />
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={styles.button}
    >
      open
    </button>
  );
};

export default OpenModalButton;

