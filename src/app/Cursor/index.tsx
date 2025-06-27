import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import styles from './index.module.scss';
import cx from 'classnames';
import Arrow from './Svgs/Arrow';
import Click from './Svgs/Click';

const Cursor = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: '50%', y: '50%' });
  const [clicked, setClicked] = useState(false);
  const [toClick, setToClick] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Utiliser l'état global Redux
  const { isClickable } = useSelector((state: RootState) => state.cursor);
  const { isScrolling } = useSelector((state: RootState) => state.scroll);

  const toggleClick = useCallback((boolean = false) => {
    // Toujours déclencher l'animation de clic, peu importe si l'élément est clickable
    setClicked(boolean);
  }, []);

  const mouseMove = (e: MouseEvent) => {
    setCursorPosition({ x: e.clientX + 'px', y: e.clientY + 'px' });
  };

  // Mettre à jour toClick en fonction de isClickable
  useEffect(() => {
    setToClick(isClickable);
  }, [isClickable]);

  useEffect(() => {
    window.addEventListener('mousemove', mouseMove, false);
    window.addEventListener('mousedown', () => toggleClick(true));
    window.addEventListener('mouseup', () => toggleClick(false));
    return () => {
      window.removeEventListener('mousemove', mouseMove, false);
      window.removeEventListener('mousedown', () => toggleClick(true));
      window.removeEventListener('mouseup', () => toggleClick(false));
    };
  }, [toggleClick]);

  const innerSvg = isClickable
    ? <Click toClick={toClick} />
    : <Arrow className={styles.arrow} />;

      
  return (
    <div
      aria-hidden="true"
      className={styles.cursor}
      ref={cursorRef}
      style={{ left: cursorPosition.x, top: cursorPosition.y }}
    >
      <svg
        className={cx(
          styles.outerSvg,
          {
            [styles.ToClick]: toClick,
            [styles.movingBorderAnimation]: isScrolling,
            [styles.clickedAnimation]: clicked,
          }
        )}
        width={64}
        height={64}
        fill="none"
      >
        <circle cx={32} cy={32} r={30} stroke="#C7E7D7" strokeDasharray="2 2" />
      </svg>
      <div className={cx(styles.background, { [styles.opacity6]: toClick })}></div>
      <div className={styles.innerSvg}>{innerSvg}</div>
    </div>
  );
};

export default Cursor; 