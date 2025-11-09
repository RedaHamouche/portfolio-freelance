import {
  calculateViewportBounds,
  calculateMapPadding,
  type ViewportBounds,
} from '@/utils/viewportCalculations';

/**
 * Service de domaine pour calculer les bounds du viewport
 */
export class ViewportBoundsService {
  /**
   * Calcule les bounds du viewport
   */
  calculateBounds(
    windowWidth: number,
    windowHeight: number,
    svgSize: { width: number; height: number },
    scale: number,
    paddingRatio: number
  ): ViewportBounds | null {
    if (windowWidth === 0 || windowHeight === 0) {
      return null;
    }

    return calculateViewportBounds(windowWidth, windowHeight, svgSize, scale, paddingRatio);
  }

  /**
   * Calcule le padding de la carte
   */
  calculatePadding(
    svgSize: { width: number; height: number },
    paddingRatio: number
  ): { paddingX: number; paddingY: number } {
    return calculateMapPadding(svgSize, paddingRatio);
  }

  /**
   * Vérifie si les dimensions sont valides pour calculer les bounds
   */
  isValidDimensions(windowWidth: number, windowHeight: number): boolean {
    return windowWidth > 0 && windowHeight > 0;
  }
}

