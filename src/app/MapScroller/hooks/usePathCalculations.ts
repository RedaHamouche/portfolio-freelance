import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import pathComponents from '../../../templating/pathComponents.json';

// interface PathComponentData {
//   id: string;
//   type: string;
//   displayName: string;
//   position: {
//     progress: number;
//     start: number;
//     end: number;
//   };
// }

interface PointPosition {
  x: number;
  y: number;
}

export const usePathCalculations = (pathRef: React.RefObject<SVGPathElement | null>) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const isAutoScrollTemporarilyPaused = useSelector((state: RootState) => state.scroll.isAutoScrollTemporarilyPaused);
  const [dashOffset, setDashOffset] = useState<number>(0);
  
  // Références pour maintenir la dernière position valide
  const lastValidPositionRef = useRef<PointPosition>({ x: 200, y: 300 });
  const lastValidAngleRef = useRef<number>(0);

  // Calculer le nextComponent via useMemo
  const nextComponent = useMemo(() => {
    const sortedComponents = [...pathComponents].sort((a, b) => b.position.progress - a.position.progress);
    let findNext = sortedComponents.find(c => c.position.progress < progress);
    if (!findNext) {
      findNext = sortedComponents[0];
    }
    return findNext;
  }, [progress]);

  // Calculer le dashOffset en fonction du progress
  useEffect(() => {
    if (pathRef.current && !isAutoScrollTemporarilyPaused) {
      const totalLength = pathRef.current.getTotalLength();
      const newDashOffset = totalLength * progress;
      setDashOffset(newDashOffset);
    }
  }, [progress, pathRef, isAutoScrollTemporarilyPaused]);

  // Calculer la position actuelle du point
  const getCurrentPointPosition = useCallback((): PointPosition => {
    if (!pathRef.current) return lastValidPositionRef.current;
    
    const totalLength = pathRef.current.getTotalLength();
    const pos = pathRef.current.getPointAtLength(progress * totalLength);
    const currentPosition = { x: pos.x, y: pos.y };
    
    // Mettre à jour la dernière position valide si on n'est pas en pause
    if (!isAutoScrollTemporarilyPaused) {
      lastValidPositionRef.current = currentPosition;
    }
    
    // Retourner la position actuelle ou la dernière position valide
    return isAutoScrollTemporarilyPaused ? lastValidPositionRef.current : currentPosition;
  }, [progress, pathRef, isAutoScrollTemporarilyPaused]);

  // Calculer l'angle de tangente du path pour la rotation du point
  const getCurrentPointAngle = useCallback((): number => {
    if (!pathRef.current) return lastValidAngleRef.current;
    
    const totalLength = pathRef.current.getTotalLength();
    const currentLength = progress * totalLength;
    const delta = 1;
    const p1 = pathRef.current.getPointAtLength(Math.max(0, currentLength - delta));
    const p2 = pathRef.current.getPointAtLength(Math.min(totalLength, currentLength + delta));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    
    // Mettre à jour le dernier angle valide si on n'est pas en pause
    if (!isAutoScrollTemporarilyPaused) {
      lastValidAngleRef.current = angle;
    }
    
    // Retourner l'angle actuel ou le dernier angle valide
    return isAutoScrollTemporarilyPaused ? lastValidAngleRef.current : angle;
  }, [progress, pathRef, isAutoScrollTemporarilyPaused]);

  // Calculer la position de la flèche
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