import { SCROLL_CONFIG } from '@/config';

/**
 * Calcule le progress (0-1) à partir de la position de scroll
 * Gère le scroll infini avec modulo
 * Scroll vers le bas = progress augmente (sens inversé)
 */
export const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  if (maxScroll <= 0) return 0;
  return ((scrollY / maxScroll) % 1 + 1) % 1;
};

/**
 * Calcule la hauteur de scroll factice basée sur la longueur du path
 */
export const calculateFakeScrollHeight = (pathLength: number): number => {
  return Math.round(pathLength * SCROLL_CONFIG.SCROLL_PER_PX);
};

/**
 * Calcule le maxScroll (hauteur scrollable) en tenant compte de la hauteur de la fenêtre
 */
export const calculateMaxScroll = (fakeScrollHeight: number, windowHeight: number): number => {
  return Math.max(1, fakeScrollHeight - windowHeight);
};

/**
 * Calcule la position de scroll Y cible à partir d'un progress
 * Scroll vers le bas = progress augmente (sens inversé)
 */
export const calculateScrollYFromProgress = (progress: number, maxScroll: number): number => {
  return progress * maxScroll;
};

/**
 * Normalise le scrollY pour gérer le scroll infini
 * Retourne le scrollY normalisé et corrige si nécessaire
 * 
 * Boucle infinie avec marges (logique originale conservée) :
 * - Au début (scrollY <= 0) : boucle vers la fin
 * - À la fin (scrollY >= maxScroll - 1) : boucle vers le début
 */
export const normalizeScrollY = (
  scrollY: number,
  maxScroll: number
): { normalizedY: number; shouldCorrect: boolean; correctionY?: number } => {
  if (scrollY <= 0) {
    return {
      normalizedY: maxScroll - SCROLL_CONFIG.SCROLL_MARGINS.TOP,
      shouldCorrect: true,
      correctionY: maxScroll - SCROLL_CONFIG.SCROLL_MARGINS.TOP,
    };
  }
  
  if (scrollY >= maxScroll - 1) {
    return {
      normalizedY: SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM,
      shouldCorrect: true,
      correctionY: SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM,
    };
  }
  
  return {
    normalizedY: scrollY,
    shouldCorrect: false,
  };
};

/**
 * Calcule le target progress ajusté en respectant la direction du scroll
 * Gère le wraparound circulaire pour choisir le bon chemin selon la direction
 * 
 * @param currentProgress Progress actuel (0-1)
 * @param targetProgress Progress cible (0-1)
 * @param direction Direction du scroll : 'forward', 'backward', ou null
 * @returns Le progress ajusté (0-1) qui respecte la direction
 */
export const calculateAdjustedTargetProgress = (
  currentProgress: number,
  targetProgress: number,
  direction: 'forward' | 'backward' | null
): number => {
  // Calculer les deux chemins possibles (forward et backward)
  const directDelta = targetProgress - currentProgress;
  const forwardDelta = directDelta >= 0 ? directDelta : directDelta + 1; // Chemin forward (vers l'avant)
  const backwardDelta = directDelta <= 0 ? directDelta : directDelta - 1; // Chemin backward (vers l'arrière)
  
  // Toujours respecter la direction du PointTrail, même si ce n'est pas le chemin le plus court
  let delta: number;
  
  if (direction === 'forward') {
    // Direction forward : toujours prendre le chemin forward
    delta = forwardDelta;
  } else if (direction === 'backward') {
    // Direction backward : toujours prendre le chemin backward
    delta = backwardDelta;
  } else {
    // Pas de direction : utiliser le chemin le plus court
    delta = Math.abs(forwardDelta) <= Math.abs(backwardDelta) ? forwardDelta : backwardDelta;
  }
  
  // Calculer le target progress ajusté en ajoutant le delta au progress actuel
  let adjustedTargetProgress = currentProgress + delta;
  // Normaliser entre 0 et 1
  adjustedTargetProgress = ((adjustedTargetProgress % 1) + 1) % 1;
  
  return adjustedTargetProgress;
};

