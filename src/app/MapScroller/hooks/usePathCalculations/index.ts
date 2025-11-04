import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  getPointOnPath,
  getPathAngleAtProgress,
  calculateArrowPosition,
  type PointPosition,
} from '@/utils/pathCalculations';
import { createPathDomain } from '@/templating/domains/path';
import { useBreakpoint } from '@/hooks/useBreakpointValue';

export const usePathCalculations = (svgPath: SVGPathElement | null) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const lastScrollDirection = useSelector((state: RootState) => state.scroll.lastScrollDirection);
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const isDesktop = useBreakpoint('>=desktop');

  // Créer une instance du domaine Path
  const pathDomain = useMemo(() => createPathDomain(), []);

  // Calculer le nextComponent via useMemo en fonction de la direction
  const nextComponent = useMemo(() => {
    return pathDomain.findNextComponentInDirection(progress, lastScrollDirection, isDesktop);
  }, [progress, lastScrollDirection, pathDomain, isDesktop]);

  // Calculer la position actuelle du point
  // Utiliser pathLength du store pour éviter les recalculs de getTotalLength()
  const getCurrentPointPosition = useCallback((): PointPosition => {
    if (!svgPath) return { x: 200, y: 300 };
    return getPointOnPath(svgPath, progress, pathLength > 0 ? pathLength : undefined);
  }, [progress, svgPath, pathLength]);

  // Calculer l'angle de tangente du path pour la rotation du point
  // Utiliser pathLength du store pour éviter les recalculs de getTotalLength()
  const getCurrentPointAngle = useCallback((): number => {
    if (!svgPath) return 0;
    return getPathAngleAtProgress(svgPath, progress, 1, pathLength > 0 ? pathLength : undefined);
  }, [progress, svgPath, pathLength]);

  // Calculer la position de la flèche (gauche ou droite)
  const getArrowPosition = useCallback((): 'left' | 'right' => {
    return calculateArrowPosition(lastScrollDirection);
  }, [lastScrollDirection]);

  return {
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  };
}; 