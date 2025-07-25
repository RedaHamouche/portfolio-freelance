import React, { useLayoutEffect, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setPathLength } from '@/store/scrollSlice';
import Dynamic from '@/templating/Dynamic';
import DynamicPathComponents from '@/templating/DynamicPathComponents';
import { SvgPath } from '@/app/MapScroller/components/SvgPath';
import PointTrail from '@/app/MapScroller/PointTrail';
import { usePathCalculations } from '@/app/MapScroller/hooks/usePathCalculations';
import gsap from 'gsap';
import { MAP_SCALE } from '@/config/mapScale';
import { MAP_PADDING_RATIO } from '@/config/mapPadding';
import { SVG_SIZE } from '@/config/path';

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
  
  // Mettre à jour la longueur du path dans le store
  useEffect(() => {
    if (svgPath) {
      const newPathLength = svgPath.getTotalLength();
      dispatch(setPathLength(newPathLength));
    }
  }, [svgPath, dispatch]);
  
  const {
    dashOffset,
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  } = usePathCalculations(svgPath);

  // Gérer le positionnement de la vue
  useLayoutEffect(() => {
    if (!svgRef.current || !svgPath || !mapWrapperRef.current) return;
    const path = svgPath;
    const totalLength = path.getTotalLength();
    const pos = path.getPointAtLength(progress * totalLength);

    const paddingX = SVG_SIZE.width * MAP_PADDING_RATIO;
    const paddingY = SVG_SIZE.height * MAP_PADDING_RATIO;
    const paddedWidth = SVG_SIZE.width + 2 * paddingX;
    const paddedHeight = SVG_SIZE.height + 2 * paddingY;

    const idealX = (pos.x + paddingX) * MAP_SCALE - window.innerWidth / 2;
    const idealY = (pos.y + paddingY) * MAP_SCALE - window.innerHeight / 2;
    const maxX = Math.max(0, paddedWidth * MAP_SCALE - window.innerWidth);
    const maxY = Math.max(0, paddedHeight * MAP_SCALE - window.innerHeight);
    const clampedX = Math.max(0, Math.min(idealX, maxX));
    const clampedY = Math.max(0, Math.min(idealY, maxY));

    const wrapper = mapWrapperRef.current;
    wrapper.style.transform = `translate(${-clampedX}px, ${-clampedY}px) scale(${MAP_SCALE})`;
    wrapper.style.transformOrigin = 'top left';
  }, [progress, svgRef, svgPath, mapWrapperRef]);

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

  const paddingX = SVG_SIZE.width * MAP_PADDING_RATIO;
  const paddingY = SVG_SIZE.height * MAP_PADDING_RATIO;

  return (
    <div
      ref={mapWrapperRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SVG_SIZE.width + 2 * paddingX,
        height: SVG_SIZE.height + 2 * paddingY,
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
        dashOffset={dashOffset}
        setSvgPath={setSvgPath}
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