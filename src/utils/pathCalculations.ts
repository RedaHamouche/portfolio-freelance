import pathComponents from '@/templating/pathComponents.json';
import { ANCHOR_RANGE } from '@/config/anchorRange';

export interface PointPosition {
  x: number;
  y: number;
}

export interface PathComponentData {
  id: string;
  type: string;
  displayName: string;
  anchorId: string;
  position: {
    progress: number;
  };
  autoScrollPauseTime?: number;
}

/**
 * Trouve le prochain composant sur le path basé sur le progress actuel
 */
export const findNextComponent = (currentProgress: number): PathComponentData | null => {
  const sortedComponents = [...pathComponents] as PathComponentData[];
  sortedComponents.sort((a, b) => b.position.progress - a.position.progress);
  
  let findNext = sortedComponents.find(c => c.position.progress < currentProgress);
  if (!findNext) {
    findNext = sortedComponents[0]; // boucle au "dernier" (le plus à droite)
  }
  
  return findNext || null;
};

/**
 * Calcule la position d'un point sur le path SVG à partir d'un progress
 */
export const getPointOnPath = (
  svgPath: SVGPathElement,
  progress: number
): PointPosition => {
  const totalLength = svgPath.getTotalLength();
  const pos = svgPath.getPointAtLength(progress * totalLength);
  return { x: pos.x, y: pos.y };
};

/**
 * Calcule l'angle de la tangente du path à un point donné
 */
export const getPathAngleAtProgress = (
  svgPath: SVGPathElement,
  progress: number,
  delta: number = 1
): number => {
  const totalLength = svgPath.getTotalLength();
  const currentLength = progress * totalLength;
  const p1 = svgPath.getPointAtLength(Math.max(0, currentLength - delta));
  const p2 = svgPath.getPointAtLength(Math.min(totalLength, currentLength + delta));
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  return angle;
};

/**
 * Calcule le dashOffset pour l'animation du path
 */
export const calculateDashOffset = (totalLength: number, progress: number): number => {
  return totalLength * progress;
};

/**
 * Détermine si un composant est actif (dans la range) basé sur le progress
 */
export const isComponentActive = (componentProgress: number, currentProgress: number): boolean => {
  return Math.abs(currentProgress - componentProgress) <= ANCHOR_RANGE / 2;
};

/**
 * Trouve le prochain anchor pour l'auto-scroll basé sur la direction
 */
export const getNextAnchor = (
  fromProgress: number,
  toProgress: number,
  tolerance: number = 0.002
): PathComponentData | null => {
  return (pathComponents as PathComponentData[]).find(c => {
    if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
    
    if (fromProgress < toProgress) {
      return fromProgress < c.position.progress && c.position.progress <= toProgress + tolerance;
    } else {
      return toProgress - tolerance <= c.position.progress && c.position.progress < fromProgress;
    }
  }) || null;
};

/**
 * Calcule la position de la flèche (gauche ou droite) basée sur le prochain composant
 */
export const calculateArrowPosition = (
  nextComponent: PathComponentData | null,
  currentProgress: number
): 'left' | 'right' => {
  if (!nextComponent) return 'right';
  return nextComponent.position.progress < currentProgress ? 'left' : 'right';
};

