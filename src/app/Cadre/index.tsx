"use client"
import styles from './index.module.scss';
import { useDispatch } from 'react-redux';
import { setDirection, resetDirection } from '../../store/scrollSlice';

const directions = [
  { className: styles.top, direction: 'haut' },
  { className: styles.bottom, direction: 'bas' },
];

const Cadre = () => {
  const dispatch = useDispatch();

  return (
    <div className={styles.cadre} aria-label="Frame Hover Navigation" onMouseLeave={() => dispatch(resetDirection())}>
      {directions.map(({ className, direction }) => (
        <div
          key={direction}
          className={className}
          data-direction={direction}
          onMouseEnter={() => dispatch(setDirection(direction))}
          aria-label={direction}
        />
      ))}
    </div>
  );
};

export default Cadre; 