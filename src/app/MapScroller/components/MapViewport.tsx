import React, { useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import Dynamic from '../../../templating/Dynamic';
import DynamicPathComponents from '../../../templating/DynamicPathComponents';
import { SvgPath } from './SvgPath';
import PointTrail from '../PointTrail';
import { usePathCalculations } from '../hooks/usePathCalculations';
import gsap from 'gsap';

const MAP_SCALE = 1;

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
  
  const {
    dashOffset,
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  } = usePathCalculations(pathRef);

  // Gérer le positionnement de la vue
  useLayoutEffect(() => {
    if (!svgRef.current || !pathRef.current || !mapWrapperRef.current) return;
    
    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    const pos = path.getPointAtLength(progress * totalLength);

    const idealX = pos.x * MAP_SCALE - window.innerWidth / 2;
    const idealY = pos.y * MAP_SCALE - window.innerHeight / 2;
    const maxX = Math.max(0, svgSize.width * MAP_SCALE - window.innerWidth);
    const maxY = Math.max(0, svgSize.height * MAP_SCALE - window.innerHeight);
    const clampedX = Math.max(0, Math.min(idealX, maxX));
    const clampedY = Math.max(0, Math.min(idealY, maxY));

    const wrapper = mapWrapperRef.current;
    wrapper.style.transform = `translate(${-clampedX}px, ${-clampedY}px) scale(${MAP_SCALE})`;
    wrapper.style.transformOrigin = 'top left';
  }, [progress, svgSize, svgRef, pathRef, mapWrapperRef]);

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

  return (
    <div
      ref={mapWrapperRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: svgSize.width,
        height: svgSize.height,
        willChange: 'transform',
        zIndex: 2,
      }}
    >
      <Dynamic />
      <DynamicPathComponents 
        pathRef={pathRef}
      />
      <SvgPath
        pathD={pathD}
        svgSize={svgSize}
        dashOffset={dashOffset}
        pathRef={pathRef}
        svgRef={svgRef}
      />
      <PointTrail 
        x={pointPosition.x}
        y={pointPosition.y}
        nextComponent={nextComponent}
        onGoToNext={handleGoToNext}
        angle={pointAngle}
        arrowPosition={arrowPosition}
      />
    </div>
  );
}; 