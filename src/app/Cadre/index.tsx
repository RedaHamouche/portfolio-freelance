"use client"
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDirection, resetDirection } from '@/store/scrollSlice';
import { RootState } from '@/store';
import styles from './index.module.scss';

const directions = [
  { className: styles.top, direction: 'haut' },
  { className: styles.bottom, direction: 'bas' },
];

const Cadre: React.FC = () => {
  const dispatch = useDispatch();
  const direction = useSelector((state: RootState) => state.scroll.direction);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          dispatch(setDirection('haut'));
          break;
        case 'ArrowDown':
          event.preventDefault();
          dispatch(setDirection('bas'));
          break;
        case 'Escape':
          event.preventDefault();
          dispatch(resetDirection());
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        dispatch(resetDirection());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch]);

  return (
    <div className={styles.cadre} aria-label="Frame Hover Navigation">
      {directions.map(({ className, direction }) => (
        <div
          key={direction}
          className={className}
          data-direction={direction}
          onMouseEnter={() => dispatch(setDirection(direction))}
          aria-label={direction}
        />
      ))}
      {direction && (
        <div className={styles.directionIndicator}>
          Direction: {direction}
        </div>
      )}
    </div>
  );
};

export default Cadre; 