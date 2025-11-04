import React, { memo, useCallback, useMemo } from 'react';
import styles from './index.module.scss';
import { useResponsivePath } from '@/hooks/useResponsivePath';

interface SvgPathProps {
  setSvgPath: (el: SVGPathElement | null) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  children?: React.ReactNode;
  viewportTransform?: { translateX: number; translateY: number; scale: number } | null;
}

export const SvgPath = memo(function SvgPath({
  setSvgPath,
  svgRef,
  children,
  viewportTransform
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

  // Calculer le clipPath pour ne rendre que la partie visible + marge
  const clipPathRect = useMemo(() => {
    if (!viewportTransform || typeof window === 'undefined') {
      // Si pas de transform, pas de clipping (tout visible)
      return null;
    }

    const viewportMargin = 100; // 200px de marge pour le preloading
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Le transform GSAP est appliqué sur le wrapper parent
    // translateX et translateY sont négatifs car ils déplacent le wrapper vers la gauche/haut
    // Pour trouver quelle partie du SVG est visible, on doit inverser la transformation
    
    // Coordonnées du coin supérieur gauche du viewport dans l'espace du wrapper (avant scale)
    const viewportLeftInWrapper = -viewportTransform.translateX / viewportTransform.scale;
    const viewportTopInWrapper = -viewportTransform.translateY / viewportTransform.scale;
    
    // Dimensions du viewport dans l'espace du wrapper (avant scale)
    const viewportWidthInWrapper = viewportWidth / viewportTransform.scale;
    const viewportHeightInWrapper = viewportHeight / viewportTransform.scale;
    
    // Ajouter la marge
    const visibleLeft = viewportLeftInWrapper - viewportMargin;
    const visibleTop = viewportTopInWrapper - viewportMargin;
    const visibleWidth = viewportWidthInWrapper + (viewportMargin * 2);
    const visibleHeight = viewportHeightInWrapper + (viewportMargin * 2);

    // Clamper les valeurs pour ne pas dépasser les limites du SVG
    const clampedX = Math.max(0, Math.min(visibleLeft, paddedWidth));
    const clampedY = Math.max(0, Math.min(visibleTop, paddedHeight));
    const clampedWidth = Math.min(visibleWidth, paddedWidth - clampedX);
    const clampedHeight = Math.min(visibleHeight, paddedHeight - clampedY);

    // Ne pas utiliser de clipPath si les valeurs sont invalides
    if (clampedWidth <= 0 || clampedHeight <= 0) {
      return null;
    }

    return { x: clampedX, y: clampedY, width: clampedWidth, height: clampedHeight };
  }, [viewportTransform, paddedWidth, paddedHeight]);

  // Callback pour obtenir la référence du path
  const handlePathRef = useCallback((el: SVGPathElement | null) => {
    setSvgPath(el);
  }, [setSvgPath]);

  const clipPathId = 'svg-viewport-clip';

  return (
    <svg
      ref={svgRef}
      width={paddedWidth}
      height={paddedHeight}
      className={styles.mainSvg}
    >
      {/* Définir le clipPath si nécessaire */}
      {clipPathRect && (
        <defs>
          <clipPath id={clipPathId}>
            <rect
              x={clipPathRect.x}
              y={clipPathRect.y}
              width={clipPathRect.width}
              height={clipPathRect.height}
            />
          </clipPath>
        </defs>
      )}
      <g 
        transform={`translate(${paddingX}, ${paddingY})`}
        clipPath={clipPathRect ? `url(#${clipPathId})` : undefined}
      >
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