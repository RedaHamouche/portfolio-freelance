import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';

/**
 * Calcule la position de scroll Y à partir d'un progress et d'un pathLength
 * Source unique de vérité pour le calcul de scrollY
 * 
 * @param progress - Le progress (0-1)
 * @param globalPathLength - La longueur globale du path
 * @returns La position de scroll Y calculée
 */
export function calculateScrollY(progress: number, globalPathLength: number): number {
  const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
  const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
  return calculateScrollYFromProgress(progress, maxScroll);
}

