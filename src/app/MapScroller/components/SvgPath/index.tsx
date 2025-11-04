import React, { memo, useCallback, useMemo } from 'react';
import styles from './index.module.scss';
import { useResponsivePath } from '@/hooks/useResponsivePath';

interface SvgPathProps {
  setSvgPath: (el: SVGPathElement | null) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  children?: React.ReactNode;
}

export const SvgPath = memo(function SvgPath({
  setSvgPath,
  svgRef,
  children
}: SvgPathProps) {
  const { pathD, svgSize, mapPaddingRatio } = useResponsivePath();
  
  // Mémoïser les calculs de padding pour éviter les recalculs inutiles
  const { paddingX, paddingY, paddedWidth, paddedHeight } = useMemo(() => {
    const px = svgSize.width * mapPaddingRatio;
    const py = svgSize.height * mapPaddingRatio;
    return {
      paddingX: px,
      paddingY: py,
      paddedWidth: svgSize.width + 2 * px,
      paddedHeight: svgSize.height + 2 * py,
    };
  }, [svgSize.width, svgSize.height, mapPaddingRatio]);

  // Callback pour obtenir la référence du path
  const handlePathRef = useCallback((el: SVGPathElement | null) => {
    setSvgPath(el);
  }, [setSvgPath]);

  return (
    <svg
      ref={svgRef}
      width={paddedWidth}
      height={paddedHeight}
      className={styles.mainSvg}
    >
      <g transform={`translate(${paddingX}, ${paddingY})`}>
        <path
          ref={handlePathRef}
          d={pathD}
          fill="none"
          stroke="#6ad7b3"
          strokeWidth={6}
          strokeDasharray="20 10"
          className={styles.path}
        />
        {children}
      </g>
    </svg>
  );
}); 