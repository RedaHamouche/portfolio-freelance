import React, { useLayoutEffect, useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setPathLength } from '@/store/scrollSlice';
import Dynamic from '@/templating/Dynamic';
import DynamicPathComponents from '@/templating/DynamicPathComponents';
import { SvgPath } from '@/app/MapScroller/components/SvgPath';
import PointTrail from '@/app/MapScroller/PointTrail';
import { SvgPathDebugger } from '@/components/SvgPathDebugger';
import { usePathCalculations } from '@/app/MapScroller/hooks/usePathCalculations';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import gsap from 'gsap';
import {
  calculateViewportTransform,
  applyViewportTransform,
  calculateMapPadding,
} from '@/utils/viewportCalculations';
import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';

interface MapViewportProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  mapWrapperRef: React.RefObject<HTMLDivElement | null>;
  globalPathLength: number;
}

export const MapViewport: React.FC<MapViewportProps> = ({
  svgRef,
  mapWrapperRef,
  globalPathLength
}) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const dispatch = useDispatch();
  const [svgPath, setSvgPath] = useState<SVGPathElement | null>(null);
  const { svgSize, mapScale, mapPaddingRatio } = useResponsivePath();
  
  // Mettre à jour la longueur du path dans le store
  useEffect(() => {
    if (svgPath) {
      const newPathLength = svgPath.getTotalLength();
      dispatch(setPathLength(newPathLength));
    }
  }, [svgPath, dispatch]);
  
  const {
    // dashOffset,
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  } = usePathCalculations(svgPath);

  // Fonction pour mettre à jour la vue
  const updateViewport = useCallback(() => {
    if (!svgRef.current || !svgPath || !mapWrapperRef.current) return;
    if (typeof window === 'undefined') return;
    
    const pointPosition = getCurrentPointPosition();
    const transform = calculateViewportTransform(
      pointPosition,
      window.innerWidth,
      window.innerHeight,
      svgSize,
      mapScale,
      mapPaddingRatio
    );
    
    applyViewportTransform(mapWrapperRef.current, transform);
  }, [svgRef, svgPath, mapWrapperRef, getCurrentPointPosition, svgSize, mapScale, mapPaddingRatio]);

  // Gérer le positionnement de la vue
  useLayoutEffect(() => {
    updateViewport();
  }, [updateViewport, progress]);

  // Gérer le resize de la fenêtre
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      updateViewport();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateViewport]);

  const handleGoToNext = useCallback(() => {
    if (!nextComponent) return;

    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    const targetScrollY = calculateScrollYFromProgress(nextComponent.position.progress, maxScroll);

    gsap.to(window, {
      scrollTo: {
        y: targetScrollY,
        autoKill: true
      },
      duration: 0.8,
      ease: 'power2.out'
    });
  }, [nextComponent, globalPathLength]);

  // Mémoïser les calculs de position/angle/arrow pour éviter les recalculs inutiles
  // Ces valeurs ne sont utilisées que si nextComponent existe, donc on les calcule conditionnellement
  const { pointPosition, pointAngle, arrowPosition } = useMemo(() => {
    if (!nextComponent) {
      return { pointPosition: null, pointAngle: 0, arrowPosition: 'right' as const };
    }
    return {
      pointPosition: getCurrentPointPosition(),
      pointAngle: getCurrentPointAngle(),
      arrowPosition: getArrowPosition(),
    };
  }, [nextComponent, getCurrentPointPosition, getCurrentPointAngle, getArrowPosition]);

  // Mémoïser le calcul du padding
  const { paddingX, paddingY } = useMemo(
    () => calculateMapPadding(svgSize, mapPaddingRatio),
    [svgSize, mapPaddingRatio]
  );

  return (
    <div
      ref={mapWrapperRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: svgSize.width + 2 * paddingX,
        height: svgSize.height + 2 * paddingY,
        minWidth: '100vw',
        minHeight: '100vh',
        willChange: 'transform',
        zIndex: 2,
      }}
    >
      <Dynamic />
      <DynamicPathComponents 
        svgPath={svgPath}
        paddingX={paddingX}
        paddingY={paddingY}
      />
      <SvgPath
        setSvgPath={setSvgPath}
        svgRef={svgRef}
      >
        <SvgPathDebugger
          svgPath={svgPath}
          paddingX={paddingX}
          paddingY={paddingY}
        />
      </SvgPath>
      {nextComponent && pointPosition && (
        <PointTrail 
          x={pointPosition.x + paddingX}
          y={pointPosition.y + paddingY}
          nextComponent={nextComponent}
          onGoToNext={handleGoToNext}
          angle={pointAngle}
          arrowPosition={arrowPosition}
        />
      )}
    </div>
  );
}; 