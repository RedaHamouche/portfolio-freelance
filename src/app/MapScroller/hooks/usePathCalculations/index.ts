import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  findNextComponent,
  getPointOnPath,
  getPathAngleAtProgress,
  calculateDashOffset,
  calculateArrowPosition,
  type PointPosition,
} from '@/utils/pathCalculations';

export const usePathCalculations = (svgPath: SVGPathElement | null) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const [dashOffset, setDashOffset] = useState<number>(0);

  // Calculer le nextComponent via useMemo
  const nextComponent = useMemo(() => {
    return findNextComponent(progress);
  }, [progress]);

  // Calculer le dashOffset en fonction du progress
  useEffect(() => {
    if (svgPath) {
      const totalLength = svgPath.getTotalLength();
      setDashOffset(calculateDashOffset(totalLength, progress));
    }
  }, [progress, svgPath]);

  // Calculer la position actuelle du point
  const getCurrentPointPosition = useCallback((): PointPosition => {
    if (!svgPath) return { x: 200, y: 300 };
    return getPointOnPath(svgPath, progress);
  }, [progress, svgPath]);

  // Calculer l'angle de tangente du path pour la rotation du point
  const getCurrentPointAngle = useCallback((): number => {
    if (!svgPath) return 0;
    return getPathAngleAtProgress(svgPath, progress);
  }, [progress, svgPath]);

  // Calculer la position de la flèche (gauche ou droite)
  const getArrowPosition = useCallback((): 'left' | 'right' => {
    return calculateArrowPosition(nextComponent, progress);
  }, [nextComponent, progress]);

  return {
    dashOffset,
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  };
}; 