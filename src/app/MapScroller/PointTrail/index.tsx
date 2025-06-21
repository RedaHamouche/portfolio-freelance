import React from 'react';
import styles from './index.module.scss';

interface PointTrailProps {
  x: number;
  y: number;
  text: string;
}

const PointTrail: React.FC<PointTrailProps> = ({ x, y, text }) => {
  return (
    <div
      className={styles.pointContainer}
      style={{
        top: `${y}px`,
        left: `${x}px`,
      }}
    >
      <span className={styles.pointText}>
        {text}
      </span>
    </div>
  );
};

export default PointTrail; 