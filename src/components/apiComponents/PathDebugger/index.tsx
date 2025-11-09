import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import styles from './index.module.scss';

export default function PathDebugger() {
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const isScrolling = useSelector((state: RootState) => state.scroll.isScrolling);
  return null;
  return (
    <div className={styles.debugger}>
      <h3>Path Debugger</h3>
      <div className={styles.info}>
        <p><strong>Longueur du path:</strong> {pathLength.toFixed(2)}px</p>
        <p><strong>Progress:</strong> {(progress * 100).toFixed(2)}%</p>
        <p><strong>Scrolling:</strong> {isScrolling ? 'Oui' : 'Non'}</p>
        <p><strong>Largeur écran:</strong> {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</p>
      </div>
    </div>
  );
} 
