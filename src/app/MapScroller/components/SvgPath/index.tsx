import React, { memo } from 'react';
import styles from './index.module.scss';
import { MAP_PADDING_RATIO } from '@/config/mapPadding';
import { PATH_D, SVG_SIZE } from '@/config/path';

interface SvgPathProps {
  // dashOffset: number;
  setSvgPath: (el: SVGPathElement | null) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export const SvgPath = memo(function SvgPath({
  // dashOffset,
  setSvgPath,
  svgRef
}: SvgPathProps) {
  // Padding basé sur la config globale
  const paddingX = SVG_SIZE.width * MAP_PADDING_RATIO;
  const paddingY = SVG_SIZE.height * MAP_PADDING_RATIO;
  const paddedWidth = SVG_SIZE.width + 2 * paddingX;
  const paddedHeight = SVG_SIZE.height + 2 * paddingY;

  return (
    <svg
      ref={svgRef}
      width={paddedWidth}
      height={paddedHeight}
      className={styles.mainSvg}
    >
      <g transform={`translate(${paddingX}, ${paddingY})`}>
        <path
          ref={setSvgPath}
          d={PATH_D}
          fill="none"
          stroke="#6ad7b3"
          strokeWidth={6}
          strokeDasharray="20 10"
          className={styles.path}
          // style={{ strokeDashoffset: dashOffset }}
        />
      </g>
    </svg>
  );
}); 