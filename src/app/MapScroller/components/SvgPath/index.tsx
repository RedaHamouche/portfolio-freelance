import React, { memo } from 'react';
import styles from './index.module.scss';
import { MAP_PADDING_RATIO } from '@/config/mapPadding';

interface SvgPathProps {
  pathD: string | null;
  svgSize: { width: number; height: number };
  dashOffset: number;
  pathRef: React.RefObject<SVGPathElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const SvgPath = memo(function SvgPath({
  pathD,
  svgSize,
  dashOffset,
  pathRef,
  svgRef
}: SvgPathProps) {
  // Padding basé sur la config globale
  const paddingX = svgSize.width * MAP_PADDING_RATIO;
  const paddingY = svgSize.height * MAP_PADDING_RATIO;
  const paddedWidth = svgSize.width + 2 * paddingX;
  const paddedHeight = svgSize.height + 2 * paddingY;

  return (
    <svg
      ref={svgRef}
      width={paddedWidth}
      height={paddedHeight}
      className={styles.mainSvg}
    >
      {pathD && (
        <g transform={`translate(${paddingX}, ${paddingY})`}>
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
        </g>
      )}
    </svg>
  );
}); 