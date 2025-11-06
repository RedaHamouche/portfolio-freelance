import {
  computeScrollProgress,
  calculateFakeScrollHeight,
  calculateMaxScroll,
  normalizeScrollY,
} from '@/utils/scrollCalculations';

/**
 * Service de domaine pour calculer le progress à partir de la position de scroll
 */
export class ScrollProgressCalculator {
  /**
   * Calcule le progress (0-1) à partir de la position de scroll Y
   */
  calculateProgress(scrollY: number, globalPathLength: number): {
    progress: number;
    shouldCorrect: boolean;
    correctionY?: number;
  } {
    if (typeof window === 'undefined') {
      return { progress: 0, shouldCorrect: false };
    }

    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    const { normalizedY, shouldCorrect, correctionY } = normalizeScrollY(scrollY, maxScroll);

    const progress = computeScrollProgress(normalizedY, maxScroll);

    return {
      progress,
      shouldCorrect,
      correctionY,
    };
  }

  /**
   * Calcule le progress initial à partir de la position de scroll actuelle
   */
  calculateInitialProgress(globalPathLength: number): number {
    if (typeof window === 'undefined') {
      return 0;
    }

    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    const { normalizedY } = normalizeScrollY(window.scrollY, maxScroll);

    return computeScrollProgress(normalizedY, maxScroll);
  }
}

