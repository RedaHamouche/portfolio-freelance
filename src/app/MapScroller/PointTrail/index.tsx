import React, { memo } from 'react';
import styles from './index.module.scss';
import classnames from 'classnames';
import { MAP_SCALE } from '@/config';

interface PathComponentData {
  id: string;
  type: string;
  displayName: string;
  anchorId: string;
  position: {
    progress: number;
  };
  autoScrollPauseTime?: number;
}

interface PointTrailProps {
  x: number;
  y: number;
  nextComponent: PathComponentData | null;
  onGoToNext: () => void;
  angle: number;
  arrowPosition: 'left' | 'right';
}

const PointTrail = memo(function PointTrail({
  x,
  y,
  nextComponent,
  onGoToNext,
  angle,
  arrowPosition
}: PointTrailProps) {
  return (
    <button
      type="button"
      className={classnames(styles.pointContainer, styles[`position-${arrowPosition}`])}
      style={{
        top: `${y}px`,
        left: `${x}px`,
        transform: `translate(-50%, -50%) scale(${1 / MAP_SCALE}) rotate(${angle}deg)`,
        transformOrigin: 'center',
      }}
      onClick={onGoToNext}
      tabIndex={0}
    >
      <span className={styles.nextComponentText}>{nextComponent?.displayName}</span>
      <div className={styles.arrowContainer}>
        <svg
          className={styles.arrow}
          xmlns="http://www.w3.org/2000/svg"
          width={14}
          height={15}
        >
          <path
            className={styles.path}
            fill="#F6F6F6"
            d="m6.318 14.23 7.212-6.228a.6.6 0 0 0 0-.906L6.318.869a.15.15 0 0 0-.249.113v1.52c0 .086.038.169.104.227l4.757 4.108H.313a.15.15 0 0 0-.151.15v1.126c0 .082.068.15.15.15H10.93L6.173 12.37a.3.3 0 0 0-.104.227v1.52c0 .127.151.197.25.112"
          />
        </svg>
      </div>
    </button>
  );
});

export default PointTrail; 