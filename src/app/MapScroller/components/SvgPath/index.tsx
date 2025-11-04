import React, { memo, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import gsap from 'gsap';
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
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pathLengthRef = useRef<number>(0);
  
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
    pathRef.current = el;
    setSvgPath(el);
    
    if (el) {
      // Calculer et cacher la longueur du path une seule fois
      const pathLength = el.getTotalLength();
      pathLengthRef.current = pathLength;
      
      // Initialiser le path pour l'effet de dessin progressif
      gsap.set(el, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength, // Commence caché
      });
    }
  }, [setSvgPath]);

  // Animer le path avec GSAP quand le progress change
  useEffect(() => {
    if (!pathRef.current) return;

    // Utiliser la valeur cachée au lieu de recalculer
    const pathLength = pathLengthRef.current;
    if (pathLength === 0) return; // Attendre que le path soit calculé
    
    // Progress 0 = path caché (dashOffset = pathLength)
    // Progress 1 = path visible (dashOffset = 0)
    const targetOffset = pathLength * (1 - progress);

    // Utiliser gsap.set pour une mise à jour instantanée et performante
    // Utiliser les propriétés CSS en camelCase pour GSAP
    gsap.set(pathRef.current, {
      strokeDasharray: pathLength,
      strokeDashoffset: targetOffset,
    });
  }, [progress]);

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
          className={styles.path}
        />
        {children}
      </g>
    </svg>
  );
}); 