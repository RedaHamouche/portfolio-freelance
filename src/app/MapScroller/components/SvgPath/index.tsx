import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import styles from './index.module.scss';
import { useResponsivePath } from '@/hooks/useResponsivePath';

interface SvgPathProps {
  setSvgPath: (el: SVGPathElement | null) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  children?: React.ReactNode;
  viewportTransform?: { translateX: number; translateY: number; scale: number } | null; // Gardé pour compatibilité mais non utilisé
}

export const SvgPath = memo(function SvgPath({
  setSvgPath,
  svgRef,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  viewportTransform: _viewportTransform // Non utilisé mais gardé pour compatibilité
}: SvgPathProps) {
  const { pathD, svgSize, mapPaddingRatio } = useResponsivePath();
  const progress = useSelector((state: RootState) => state.scroll.progress);
  
  // Console.log pour debug mobile
  useEffect(() => {
    console.log('[SvgPath] Progress:', progress, '(', (progress * 100).toFixed(2), '%)');
  }, [progress]);
  
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
          strokeWidth={0.5}
          className={styles.path}
        />
        {children}
      </g>
    </svg>
  );
}); 