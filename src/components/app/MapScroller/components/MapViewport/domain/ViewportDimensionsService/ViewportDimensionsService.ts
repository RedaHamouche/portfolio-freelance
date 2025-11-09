import { getViewportDimensions } from '@/utils/viewportCalculations';

/**
 * Service de domaine pour obtenir les dimensions du viewport
 * Gère les cas spéciaux comme iOS Safari avec visualViewport
 */
export class ViewportDimensionsService {
  /**
   * Obtient les dimensions actuelles du viewport
   */
  getDimensions(): { width: number; height: number } {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return getViewportDimensions();
  }

  /**
   * Vérifie si les dimensions sont valides
   */
  isValidDimensions(dimensions: { width: number; height: number }): boolean {
    return dimensions.width > 0 && dimensions.height > 0;
  }
}

