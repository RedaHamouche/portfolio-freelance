/**
 * Composant React pour le domaine Page
 * Utilise l'API du domaine Page pour rendre les composants
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { getPointOnPath } from '@/utils/pathCalculations';
import mappingComponent from '../mappingComponent';
import { calculateMapPadding } from '@/utils/viewportCalculations';
import { createPageDomain } from '../domains/page';

// Hook utilitaire pour IntersectionObserver sur un tableau de refs
function useMultipleInView(refs: React.RefObject<HTMLDivElement | null>[], threshold = 0.1) {
  const [inViews, setInViews] = useState<boolean[]>(refs.map(() => false));

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    refs.forEach((ref, idx) => {
      if (!ref.current) return;
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          setInViews((prev) => {
            const copy = [...prev];
            copy[idx] = entry.isIntersecting;
            return copy;
          });
        },
        { threshold }
      );
      observer.observe(ref.current);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs.length]);

  return inViews;
}

interface DynamicProps {
  svgPath?: SVGPathElement | null;
  paddingX?: number;
  paddingY?: number;
}

export default function Dynamic({ svgPath, paddingX, paddingY }: DynamicProps) {
  const { mapScale, svgSize, mapPaddingRatio } = useResponsivePath();
  const isDesktop = useBreakpoint('>=desktop');
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);
  
  // Créer une instance du domaine Page
  const pageDomain = useMemo(() => createPageDomain(), []);
  
  // Calculer le padding si non fourni
  const calculatedPadding = useMemo(() => {
    if (paddingX !== undefined && paddingY !== undefined) {
      return { paddingX, paddingY };
    }
    return calculateMapPadding(svgSize, mapPaddingRatio);
  }, [paddingX, paddingY, svgSize, mapPaddingRatio]);
  
  // Calculer la position du point 0 (progress = 0) sur le path SVG
  const originPoint = useMemo(() => {
    if (!svgPath || pathLength <= 0) {
      return { x: 0, y: 0 };
    }
    try {
      const point = getPointOnPath(svgPath, 0, pathLength);
      return {
        x: point.x + calculatedPadding.paddingX,
        y: point.y + calculatedPadding.paddingY,
      };
    } catch (error) {
      console.error('Dynamic: Error calculating originPoint', error);
      return { x: 0, y: 0 };
    }
  }, [svgPath, pathLength, calculatedPadding.paddingX, calculatedPadding.paddingY]);

  // Récupérer les composants via l'API du domaine selon le breakpoint
  const components = useMemo(() => pageDomain.getComponents(isDesktop), [pageDomain, isDesktop]);

  // Utilise useMemo pour initialiser les refs une seule fois
  const refs = useMemo(
    () => components.map(() => React.createRef<HTMLDivElement>()),
    [components]
  );

  // Hook pour savoir si chaque ref est dans le viewport
  const inViews = useMultipleInView(refs, 0.1);

  if (!components || components.length === 0) {
    return null;
  }

  return (
    <>
      {components.map((item, idx) => {
        const Comp = mappingComponent[item.type];
        
        if (!Comp) {
          console.error(`Dynamic: Component type "${item.type}" not found in mappingComponent`);
          return null;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { position, ...rest } = item;
        const componentProps = { ...rest };
        
        // Utiliser l'API du domaine pour calculer la position
        const { top, left } = pageDomain.calculatePosition(item, originPoint);
        
        // Calculer les styles de position CSS
        const positionStyles: React.CSSProperties = {};
        if (top !== undefined) {
          positionStyles.top = top;
        }
        if (left !== undefined) {
          positionStyles.left = left;
        }
        
        return (
          <div
            key={idx}
            ref={refs[idx]}
            data-component-type={item.type}
            style={{
              position: 'absolute',
              ...positionStyles,
              pointerEvents: 'auto',
              opacity: inViews[idx] ? 1 : 0,
              transition: 'opacity 0.5s',
              transform: `scale(${1 / mapScale})`,
              transformOrigin: 'top left',
              zIndex: 10,
            }}
          >
            <Comp {...componentProps} />
          </div>
        );
      })}
    </>
  );
}

