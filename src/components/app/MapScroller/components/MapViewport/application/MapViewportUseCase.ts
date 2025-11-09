import { ViewportBoundsService } from '../domain/ViewportBoundsService';
import { ViewportTransformService } from '../domain/ViewportTransformService';
import { ViewportDimensionsService } from '../domain/ViewportDimensionsService';
import type { ViewportBounds, ViewportTransform } from '@/utils/viewportCalculations';
import type { PointPosition } from '@/utils/pathCalculations/types';

export interface MapViewportConfig {
  svgSize: { width: number; height: number };
  scale: number;
  paddingRatio: number;
}

/**
 * Use case pour gérer la vue du viewport de la carte
 * Orchestre les domain services pour calculer les bounds et transformations
 */
export class MapViewportUseCase {
  private readonly boundsService: ViewportBoundsService;
  private readonly transformService: ViewportTransformService;
  private readonly dimensionsService: ViewportDimensionsService;

  constructor(
    boundsService: ViewportBoundsService,
    transformService: ViewportTransformService,
    dimensionsService: ViewportDimensionsService
  ) {
    this.boundsService = boundsService;
    this.transformService = transformService;
    this.dimensionsService = dimensionsService;
  }

  /**
   * Calcule les bounds du viewport
   */
  calculateBounds(
    windowWidth: number,
    windowHeight: number,
    config: MapViewportConfig
  ): ViewportBounds | null {
    return this.boundsService.calculateBounds(
      windowWidth,
      windowHeight,
      config.svgSize,
      config.scale,
      config.paddingRatio
    );
  }

  /**
   * Calcule le padding de la carte
   */
  calculatePadding(config: MapViewportConfig): { paddingX: number; paddingY: number } {
    return this.boundsService.calculatePadding(config.svgSize, config.paddingRatio);
  }

  /**
   * Calcule la transformation pour centrer un point
   */
  calculateTransform(
    point: PointPosition | null,
    windowWidth: number,
    windowHeight: number,
    config: MapViewportConfig,
    viewportBounds?: ViewportBounds | null
  ): ViewportTransform | null {
    if (!this.transformService.isValidParams(point, windowWidth, windowHeight)) {
      return null;
    }

    return this.transformService.calculateTransform(
      point!,
      windowWidth,
      windowHeight,
      config.svgSize,
      config.scale,
      config.paddingRatio,
      viewportBounds
    );
  }

  /**
   * Obtient les dimensions actuelles du viewport
   */
  getViewportDimensions(): { width: number; height: number } {
    return this.dimensionsService.getDimensions();
  }

  /**
   * Vérifie si les dimensions sont valides
   */
  isValidDimensions(dimensions: { width: number; height: number }): boolean {
    return this.dimensionsService.isValidDimensions(dimensions);
  }
}

