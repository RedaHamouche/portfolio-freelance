import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './index.module.scss';
import cx from 'classnames';
import { cursorClasses } from './Svgs/cursorStates';
import Arrow from './Svgs/Arrow';
import Click from './Svgs/Click';

const Cursor = ({ direction }: { direction?: string }) => {
  const [cursorPosition, setCursorPosition] = useState({ x: '50%', y: '50%' });
  const [clicked, setClicked] = useState(false);
  const [toClick, setToClick] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // isClickable toujours true pour l'instant
  const clickable = direction === cursorClasses.click;

  const toggleClick = useCallback((boolean = false) => {
    if (clickable) {
      setClicked(boolean);
    }
  }, [clickable]);

  const mouseMove = (e: MouseEvent) => {
    setToClick(true);
    setCursorPosition({ x: e.clientX + 'px', y: e.clientY + 'px' });
  };

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

  const innerSvg = clickable
    ? <Click toClick={toClick} />
    : <Arrow direction={direction} className={styles.arrow} onClick={() => {}} />;

  return (
    <div
      className={styles.cursor}
      ref={cursorRef}
      style={{ left: cursorPosition.x, top: cursorPosition.y }}
    >
      <svg
        className={cx(
          styles.outerSvg,
          {
            [styles.click]: toClick,
            [styles.movingBorderAnimation]: !clickable,
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