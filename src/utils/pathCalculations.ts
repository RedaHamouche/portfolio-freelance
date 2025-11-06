import { ANCHOR_RANGE } from '@/config';
import { globalPathPositionCache } from './pathPositionCache';
import type { PointPosition } from '@/types/path';

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
 * Pré-trie les composants pour optimiser les recherches
 * @deprecated Utiliser les versions avec cache dans PathDomain
 */
function sortComponents(components: PathComponentData[]) {
  return {
    sortedByProgressDesc: [...components].sort((a, b) => b.position.progress - a.position.progress),
    sortedByProgressAsc: [...components].sort((a, b) => a.position.progress - b.position.progress),
  };
}

/**
 * Recherche binaire pour trouver le composant le plus proche avec progress > target
 * Complexité: O(log n) au lieu de O(n)
 * Retourne le composant avec le plus petit progress qui est > target
 */
function binarySearchForward(
  sorted: PathComponentData[],
  target: number
): PathComponentData | null {
  let left = 0;
  let right = sorted.length - 1;
  let result: PathComponentData | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sorted[mid].position.progress > target) {
      // Ce composant est valide, mais on cherche le plus proche (plus petit progress)
      result = sorted[mid];
      right = mid - 1; // Chercher plus tôt (plus petit index = plus petit progress)
    } else {
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Recherche binaire pour trouver le composant le plus proche avec progress < target
 * Complexité: O(log n) au lieu de O(n)
 * Retourne le composant avec le plus grand progress qui est < target
 * Note: sorted est trié décroissant (plus grand progress en premier)
 */
function binarySearchBackward(
  sorted: PathComponentData[],
  target: number
): PathComponentData | null {
  let left = 0;
  let right = sorted.length - 1;
  let result: PathComponentData | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sorted[mid].position.progress < target) {
      // Ce composant est valide
      // Dans un array trié décroissant, on veut le premier (index le plus petit) qui est < target
      // car c'est celui avec le plus grand progress
      result = sorted[mid];
      right = mid - 1; // Chercher plus tôt (plus petit index = plus grand progress dans desc)
    } else {
      // sorted[mid].progress >= target, donc on doit aller plus loin (index plus grand)
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Trouve le prochain composant sur le path basé sur le progress actuel
 * @deprecated Utiliser findNextComponentInDirection à la place
 */
export const findNextComponent = (
  currentProgress: number,
  components: PathComponentData[]
): PathComponentData | null => {
  const { sortedByProgressDesc } = sortComponents(components);
  const findNext = sortedByProgressDesc.find(c => c.position.progress < currentProgress);
  if (!findNext) {
    return sortedByProgressDesc[0] || null; // boucle au "dernier" (le plus à droite)
  }
  return findNext;
};

/**
 * Trouve le prochain composant dans la direction du scroll
 * Optimisé avec recherche binaire pour O(log n) au lieu de O(n)
 * @param currentProgress Progress actuel (0-1)
 * @param direction Direction du scroll : 'forward' (progress augmente), 'backward' (progress diminue), ou null
 * @param components Liste des composants à chercher (doit être triée)
 * @param sortedAsc Array trié par progress croissant (optionnel, calculé si non fourni)
 * @param sortedDesc Array trié par progress décroissant (optionnel, calculé si non fourni)
 * @returns Le composant le plus proche dans la direction spécifiée, ou le plus proche globalement si direction est null
 */
export const findNextComponentInDirection = (
  currentProgress: number,
  direction: 'forward' | 'backward' | null,
  components: PathComponentData[],
  sortedAsc?: PathComponentData[],
  sortedDesc?: PathComponentData[]
): PathComponentData | null => {
  // Utiliser les arrays triés fournis ou les calculer
  const asc = sortedAsc ?? [...components].sort((a, b) => a.position.progress - b.position.progress);
  const desc = sortedDesc ?? [...components].sort((a, b) => b.position.progress - a.position.progress);
  
  // Si pas de direction, on utilise la logique originale
  if (!direction) {
    // Utiliser recherche binaire pour backward
    const backwardComponent = binarySearchBackward(desc, currentProgress);
    return backwardComponent ?? desc[0] ?? null;
  }
  
  if (direction === 'forward') {
    // Recherche binaire pour O(log n)
    const forwardComponent = binarySearchForward(asc, currentProgress);
    
    if (forwardComponent) {
      return forwardComponent;
    }
    
    // Si aucun composant en avant, on boucle au début (le premier avec le plus petit progress)
    return asc[0] || null;
  } else {
    // direction === 'backward'
    // Recherche binaire pour O(log n)
    const backwardComponent = binarySearchBackward(desc, currentProgress);
    
    if (backwardComponent) {
      return backwardComponent;
    }
    
    // Si aucun composant en arrière, on boucle à la fin (le composant avec le plus grand progress)
    return desc[0] || null;
  }
};

/**
 * Calcule la position d'un point sur le path SVG à partir d'un progress
 * Utilise un cache pour éviter les recalculs coûteux de getPointAtLength()
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
  
  // Vérifier le cache d'abord
  const cached = globalPathPositionCache.getPosition(progress, totalLength);
  if (cached) {
    return cached;
  }
  
  // Calculer la position
  const pos = svgPath.getPointAtLength(progress * totalLength);
  const result = { x: pos.x, y: pos.y };
  
  // Mettre en cache
  globalPathPositionCache.setPosition(progress, totalLength, result);
  
  return result;
};

/**
 * Calcule un delta adaptatif pour le calcul de tangente
 * Utilise un pourcentage de la longueur du path pour garantir une tangente précise
 * même sur les paths très longs ou très courts
 * @param pathLength Longueur totale du path
 * @param minDelta Minimum absolu en pixels (défaut: 2)
 * @param percentage Pourcentage de la longueur (défaut: 0.001 = 0.1%)
 * @returns Delta adaptatif en pixels
 */
export const calculateAdaptiveDelta = (
  pathLength: number,
  minDelta: number = 2,
  percentage: number = 0.001
): number => {
  return Math.max(minDelta, pathLength * percentage);
};

/**
 * Calcule l'angle de la tangente du path à un point donné
 * Optimisé pour être précis sur mobile et desktop avec des longueurs de path différentes
 * Utilise un cache pour éviter les recalculs coûteux de getPointAtLength()
 * @param svgPath L'élément SVG path
 * @param progress Progress (0-1)
 * @param delta Delta pour calculer la tangente (défaut: calculé automatiquement)
 * @param pathLength Longueur totale du path (optionnel, calculé si non fourni)
 * @returns Angle en degrés (0-360, où 0° = droite, 90° = bas, 180° = gauche, 270° = haut)
 */
export const getPathAngleAtProgress = (
  svgPath: SVGPathElement,
  progress: number,
  delta?: number,
  pathLength?: number
): number => {
  const totalLength = pathLength ?? svgPath.getTotalLength();
  
  // Si delta n'est pas fourni, calculer un delta adaptatif
  const effectiveDelta = delta ?? calculateAdaptiveDelta(totalLength);
  
  // Vérifier le cache d'abord
  const cached = globalPathPositionCache.getAngle(progress, totalLength, effectiveDelta);
  if (cached !== null) {
    return cached;
  }
  
  const currentLength = progress * totalLength;
  
  // Calculer les deux points pour la tangente
  // Utiliser Math.max/Math.min pour éviter les valeurs négatives ou supérieures à totalLength
  const length1 = Math.max(0, currentLength - effectiveDelta);
  const length2 = Math.min(totalLength, currentLength + effectiveDelta);
  
  let angle: number;
  
  // Si les deux points sont identiques (cas limite), utiliser un delta plus petit
  if (length1 === length2) {
    const fallbackDelta = Math.min(effectiveDelta, totalLength * 0.0001);
    const p1 = svgPath.getPointAtLength(Math.max(0, currentLength - fallbackDelta));
    const p2 = svgPath.getPointAtLength(Math.min(totalLength, currentLength + fallbackDelta));
    
    if (p1.x === p2.x && p1.y === p2.y) {
      // Si toujours identique, retourner 0 (angle horizontal par défaut)
      angle = 0;
    } else {
      angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    }
  } else {
    const p1 = svgPath.getPointAtLength(length1);
    const p2 = svgPath.getPointAtLength(length2);
    
    // Calculer l'angle entre les deux points
    angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  }
  
  // Mettre en cache
  globalPathPositionCache.setAngle(progress, totalLength, effectiveDelta, angle);
  
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
 * Optimisé : filtre d'abord les candidats dans la plage avant de chercher
 * @param fromProgress Progress de départ
 * @param toProgress Progress d'arrivée
 * @param components Liste des composants à chercher
 * @param tolerance Tolérance pour la recherche (défaut: 0.002)
 */
export const getNextAnchor = (
  fromProgress: number,
  toProgress: number,
  components: PathComponentData[],
  tolerance: number = 0.002
): PathComponentData | null => {
  // Filtrer d'abord les composants qui ont autoScrollPauseTime
  const candidates = components.filter(c => {
    if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
    
    // Vérifier si le composant est dans la plage
    if (fromProgress < toProgress) {
      return fromProgress < c.position.progress && c.position.progress <= toProgress + tolerance;
    } else {
      return toProgress - tolerance <= c.position.progress && c.position.progress < fromProgress;
    }
  });
  
  // Si plusieurs candidats, retourner le premier (le plus proche)
  return candidates[0] || null;
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
