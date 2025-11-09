import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import styles from './index.module.scss';
import Arrow from './Svgs/Arrow';
import Click from './Svgs/Click';
import { useCursorAnimations } from './useAnimation';

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const outerSvgRef = useRef<SVGSVGElement>(null);
  const innerSvgRef = useRef<HTMLDivElement>(null);

  // Utiliser l'état global Redux pour l'affichage conditionnel
  const { isClickable } = useSelector((state: RootState) => state.cursor);

  // Toute la logique d'animation est gérée dans le hook
  useCursorAnimations({
    cursorElement: cursorRef,
    outerSvg: outerSvgRef,
    innerSvgContainer: innerSvgRef,
  });

  return (
    <div
      aria-hidden="true"
      className={styles.main}
      ref={cursorRef}
    >
      <svg
        ref={outerSvgRef}
        className={styles.outerSvg}
        width={64}
        height={64}
        fill="none"
      >
        <circle className={styles.circle} cx={32} cy={32} r={30} strokeDasharray="2 2" />
      </svg>
      <div className={styles.background}></div>
      <div ref={innerSvgRef} className={styles.innerSvg}>
        {isClickable ? <Click toClick={isClickable} /> : <Arrow className={styles.arrow} />}
      </div>
    </div>
  );
};

export default Cursor; 