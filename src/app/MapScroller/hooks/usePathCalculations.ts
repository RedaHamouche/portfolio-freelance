import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import pathComponents from '../../../templating/pathComponents.json';

interface PathComponentData {
  id: string;
  type: string;
  displayName: string;
  position: {
    progress: number;
    start: number;
    end: number;
  };
}

interface PointPosition {
  x: number;
  y: number;
}

export const usePathCalculations = (pathRef: React.RefObject<SVGPathElement | null>) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const [dashOffset, setDashOffset] = useState<number>(0);
  const [nextComponent, setNextComponent] = useState<PathComponentData | null>(null);

  // Fonction pour détecter la zone actuelle
  const getCurrentComponent = useCallback((currentProgress: number): PathComponentData | null => {
    return pathComponents.find((component: PathComponentData) => 
      currentProgress >= component.position.start && currentProgress <= component.position.end
    ) || null;
  }, []);

  // Mettre à jour la zone actuelle quand le progress change
  useEffect(() => {
    // Correction du sens : chercher le plus grand progress < progress actuel
    const sortedComponents = [...pathComponents].sort((a, b) => b.position.progress - a.position.progress);
    let findNext = sortedComponents.find(c => c.position.progress < progress);
    if (!findNext) {
      findNext = sortedComponents[0]; // boucle au "dernier" (le plus à droite)
    }
    setNextComponent(findNext);
  }, [progress, getCurrentComponent]);

  // Calculer le dashOffset en fonction du progress
  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      const newDashOffset = totalLength * progress;
      setDashOffset(newDashOffset);
    }
  }, [progress, pathRef]);

  // Calculer la position actuelle du point
  const getCurrentPointPosition = useCallback((): PointPosition => {
    if (!pathRef.current) return { x: 200, y: 300 };
    const totalLength = pathRef.current.getTotalLength();
    const pos = pathRef.current.getPointAtLength(progress * totalLength);
    return { x: pos.x, y: pos.y };
  }, [progress, pathRef]);

  // Calculer l'angle de tangente du path pour la rotation du point
  const getCurrentPointAngle = useCallback((): number => {
    if (!pathRef.current) return 0;
    const totalLength = pathRef.current.getTotalLength();
    const currentLength = progress * totalLength;
    const delta = 1; // px sur le path
    const p1 = pathRef.current.getPointAtLength(Math.max(0, currentLength - delta));
    const p2 = pathRef.current.getPointAtLength(Math.min(totalLength, currentLength + delta));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    return angle;
  }, [progress, pathRef]);

  // Calculer la position de la flèche (gauche ou droite)
  const getArrowPosition = useCallback((): 'left' | 'right' => {
    if (!nextComponent) return 'right';
    
    if (nextComponent.position.progress < progress) {
      return 'left';
    } else {
      return 'right';
    }
  }, [nextComponent, progress]);

  return {
    dashOffset,
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  };
}; 