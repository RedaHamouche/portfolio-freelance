/**
 * Composant React pour le domaine Page
 * Utilise l'API du domaine Page pour rendre les composants
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { getPointOnPath } from '@/utils/pathCalculations';
import mappingComponent from '@/templating/mappingComponent';
import { calculateMapPadding } from '@/utils/viewportCalculations';
import { createPageDomain } from '@/templating/domains/page';

// useMultipleInView supprimé - voir OPTIMIZATION_NOTES.md pour l'historique

interface DynamicProps {
  svgPath?: SVGPathElement | null;
  paddingX?: number;
  paddingY?: number;
}

export default function Dynamic({ svgPath, paddingX, paddingY }: DynamicProps) {
  const { mapScale, svgSize, mapPaddingRatio } = useResponsivePath();
  // OPTIMISATION: Déterminer isDesktop une seule fois au chargement (pas de resize)
  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024; // Desktop breakpoint
  }, []);
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

  // Refs supprimés - plus besoin d'IntersectionObserver pour l'opacity

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
            data-component-type={item.type}
            style={{
              position: 'absolute',
              ...positionStyles,
              pointerEvents: 'auto',
              opacity: 1, // Opacity directe, pas d'animation ni de lazy loading
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

