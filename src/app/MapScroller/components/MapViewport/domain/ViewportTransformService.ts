import {
  calculateViewportTransform,
  type ViewportTransform,
  type ViewportBounds,
} from '@/utils/viewportCalculations';
import type { PointPosition } from '@/utils/pathCalculations';

/**
 * Service de domaine pour calculer les transformations du viewport
 */
export class ViewportTransformService {
  /**
   * Calcule la transformation du viewport pour centrer un point
   */
  calculateTransform(
    point: PointPosition,
    windowWidth: number,
    windowHeight: number,
    svgSize: { width: number; height: number },
    scale: number,
    paddingRatio: number,
    viewportBounds?: ViewportBounds | null
  ): ViewportTransform {
    return calculateViewportTransform(
      point,
      windowWidth,
      windowHeight,
      svgSize,
      scale,
      paddingRatio,
      viewportBounds
    );
  }

  /**
   * Vérifie si les paramètres sont valides pour calculer une transformation
   */
  isValidParams(
    point: PointPosition | null,
    windowWidth: number,
    windowHeight: number
  ): boolean {
    return (
      point !== null &&
      windowWidth > 0 &&
      windowHeight > 0 &&
      typeof point.x === 'number' &&
      typeof point.y === 'number'
    );
  }
}

