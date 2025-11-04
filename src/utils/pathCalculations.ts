import pathComponents from '@/templating/pathComponents.json';
import { ANCHOR_RANGE } from '@/config';

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

// Pré-trier les composants une seule fois au chargement du module pour améliorer les performances
const allComponents = [...pathComponents] as PathComponentData[];
const sortedByProgressDesc = [...allComponents].sort((a, b) => b.position.progress - a.position.progress);
const sortedByProgressAsc = [...allComponents].sort((a, b) => a.position.progress - b.position.progress);

/**
 * Trouve le prochain composant sur le path basé sur le progress actuel
 * @deprecated Utiliser findNextComponentInDirection à la place
 */
export const findNextComponent = (currentProgress: number): PathComponentData | null => {
  // Utiliser la version pré-triée au lieu de trier à chaque appel
  const findNext = sortedByProgressDesc.find(c => c.position.progress < currentProgress);
  if (!findNext) {
    return sortedByProgressDesc[0] || null; // boucle au "dernier" (le plus à droite)
  }
  return findNext;
};

/**
 * Trouve le prochain composant dans la direction du scroll
 * @param currentProgress Progress actuel (0-1)
 * @param direction Direction du scroll : 'forward' (progress augmente), 'backward' (progress diminue), ou null
 * @returns Le composant le plus proche dans la direction spécifiée, ou le plus proche globalement si direction est null
 */
export const findNextComponentInDirection = (
  currentProgress: number,
  direction: 'forward' | 'backward' | null
): PathComponentData | null => {
  // Si pas de direction, on utilise la logique originale
  if (!direction) {
    return findNextComponent(currentProgress);
  }
  
  if (direction === 'forward') {
    // On cherche le composant le plus proche avec progress > currentProgress
    // Utiliser la version pré-triée par ordre croissant pour avoir le plus proche directement
    const forwardComponent = sortedByProgressAsc.find(c => c.position.progress > currentProgress);
    
    if (forwardComponent) {
      return forwardComponent;
    }
    
    // Si aucun composant en avant, on boucle au début (le premier avec le plus petit progress)
    return sortedByProgressAsc[0] || null;
  } else {
    // direction === 'backward'
    // On cherche le composant le plus proche avec progress < currentProgress
    // Utiliser la version pré-triée par ordre décroissant pour avoir le plus proche directement
    const backwardComponent = sortedByProgressDesc.find(c => c.position.progress < currentProgress);
    
    if (backwardComponent) {
      return backwardComponent;
    }
    
    // Si aucun composant en arrière, on boucle à la fin (le composant avec le plus grand progress)
    return sortedByProgressDesc[0] || null;
  }
};

/**
 * Calcule la position d'un point sur le path SVG à partir d'un progress
 * @param svgPath L'élément SVG path
 * @param progress Progress (0-1)
 * @param pathLength Longueur totale du path (optionnel, calculé si non fourni)
 */
export const getPointOnPath = (
  svgPath: SVGPathElement,
  progress: number,
  pathLength?: number
): PointPosition => {
  const totalLength = pathLength ?? svgPath.getTotalLength();
  const pos = svgPath.getPointAtLength(progress * totalLength);
  return { x: pos.x, y: pos.y };
};

/**
 * Calcule l'angle de la tangente du path à un point donné
 * @param svgPath L'élément SVG path
 * @param progress Progress (0-1)
 * @param delta Delta pour calculer la tangente (défaut: 1)
 * @param pathLength Longueur totale du path (optionnel, calculé si non fourni)
 */
export const getPathAngleAtProgress = (
  svgPath: SVGPathElement,
  progress: number,
  delta: number = 1,
  pathLength?: number
): number => {
  const totalLength = pathLength ?? svgPath.getTotalLength();
  const currentLength = progress * totalLength;
  const p1 = svgPath.getPointAtLength(Math.max(0, currentLength - delta));
  const p2 = svgPath.getPointAtLength(Math.min(totalLength, currentLength + delta));
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  return angle;
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
 * Calcule la position de la flèche (gauche ou droite) basée sur la direction du scroll
 */
export const calculateArrowPosition = (
  direction: 'forward' | 'backward' | null
): 'left' | 'right' => {
  if (direction === 'forward') return 'right';
  if (direction === 'backward') return 'left';
  // Par défaut, flèche à droite si pas de direction
  return 'right';
};

