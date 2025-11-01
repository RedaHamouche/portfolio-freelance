import { SCROLL_CONFIG } from '@/config/scroll';

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

