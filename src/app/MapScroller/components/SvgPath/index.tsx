import React, { memo } from 'react';
import styles from './index.module.scss';
import { MAP_PADDING_RATIO } from '@/config';
import { useResponsivePath } from '@/hooks/useResponsivePath';

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
  const { pathD, svgSize } = useResponsivePath();
  
  // Padding basé sur la config responsive
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
      <g transform={`translate(${paddingX}, ${paddingY})`}>
        <path
          ref={setSvgPath}
          d={pathD}
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