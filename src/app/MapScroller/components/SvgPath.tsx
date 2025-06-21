import React from 'react';
import styles from '../index.module.scss';

interface SvgPathProps {
  pathD: string | null;
  svgSize: { width: number; height: number };
  dashOffset: number;
  pathRef: React.RefObject<SVGPathElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const SvgPath: React.FC<SvgPathProps> = ({
  pathD,
  svgSize,
  dashOffset,
  pathRef,
  svgRef
}) => {
  return (
    <svg
      ref={svgRef}
      width={svgSize.width}
      height={svgSize.height}
      className={styles.mainSvg}
    >
      {pathD && (
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="#6ad7b3"
          strokeWidth={6}
          strokeDasharray="20 10"
          className={styles.path}
          style={{ strokeDashoffset: dashOffset }}
        />
      )}
    </svg>
  );
}; 