import React, { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import Dynamic from '../../../templating/Dynamic';
import DynamicPathComponents from '../../../templating/DynamicPathComponents';
import { SvgPath } from './SvgPath';
import PointTrail from '../PointTrail';
import { usePathCalculations } from '../hooks/usePathCalculations';
import gsap from 'gsap';
import { MAP_SCALE } from '@/config/mapScale';
import { MAP_PADDING_RATIO } from '@/config/mapPadding';

interface MapViewportProps {
  svgSize: { width: number; height: number };
  pathD: string | null;
  pathRef: React.RefObject<SVGPathElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  mapWrapperRef: React.RefObject<HTMLDivElement | null>;
  globalPathLength: number;
}

export const MapViewport: React.FC<MapViewportProps> = ({
  svgSize,
  pathD,
  pathRef,
  svgRef,
  mapWrapperRef,
  globalPathLength
}) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const isAutoScrollTemporarilyPaused = useSelector((state: RootState) => state.scroll.isAutoScrollTemporarilyPaused);
  
  const {
    dashOffset,
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  } = usePathCalculations(pathRef);

  // Gérer le positionnement de la vue (seulement si pas en pause temporaire)
  useLayoutEffect(() => {
    if (!svgRef.current || !pathRef.current || !mapWrapperRef.current || isAutoScrollTemporarilyPaused) return;
    
    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    const pos = path.getPointAtLength(progress * totalLength);

    const paddingX = svgSize.width * MAP_PADDING_RATIO;
    const paddingY = svgSize.height * MAP_PADDING_RATIO;
    const paddedWidth = svgSize.width + 2 * paddingX;
    const paddedHeight = svgSize.height + 2 * paddingY;

    const idealX = (pos.x + paddingX) * MAP_SCALE - window.innerWidth / 2;
    const idealY = (pos.y + paddingY) * MAP_SCALE - window.innerHeight / 2;
    const maxX = Math.max(0, paddedWidth * MAP_SCALE - window.innerWidth);
    const maxY = Math.max(0, paddedHeight * MAP_SCALE - window.innerHeight);
    const clampedX = Math.max(0, Math.min(idealX, maxX));
    const clampedY = Math.max(0, Math.min(idealY, maxY));

    const wrapper = mapWrapperRef.current;
    wrapper.style.transform = `translate(${-clampedX}px, ${-clampedY}px) scale(${MAP_SCALE})`;
    wrapper.style.transformOrigin = 'top left';
  }, [progress, svgSize, svgRef, pathRef, mapWrapperRef, isAutoScrollTemporarilyPaused]);

  const handleGoToNext = () => {
    if (!nextComponent) return;

    const fakeScrollHeight = Math.round(globalPathLength * 1.5);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    const targetScrollY = (1 - nextComponent.position.progress) * maxScroll;

    gsap.to(window, {
      scrollTo: {
        y: targetScrollY,
        autoKill: true
      },
      duration: 0.8,
      ease: 'power2.out'
    });
  };

  const pointPosition = getCurrentPointPosition();
  const pointAngle = getCurrentPointAngle();
  const arrowPosition = getArrowPosition();

  const paddingX = svgSize.width * MAP_PADDING_RATIO;
  const paddingY = svgSize.height * MAP_PADDING_RATIO;

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
        pathRef={pathRef}
        paddingX={paddingX}
        paddingY={paddingY}
      />
      <SvgPath
        pathD={pathD}
        svgSize={svgSize}
        dashOffset={dashOffset}
        pathRef={pathRef}
        svgRef={svgRef}
      />
      <PointTrail 
        x={pointPosition.x + paddingX}
        y={pointPosition.y + paddingY}
        nextComponent={nextComponent}
        onGoToNext={handleGoToNext}
        angle={pointAngle}
        arrowPosition={arrowPosition}
      />
    </div>
  );
}; 