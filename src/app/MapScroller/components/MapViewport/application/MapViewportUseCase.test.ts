import { MapViewportUseCase } from './MapViewportUseCase';
import { ViewportBoundsService } from '../domain/ViewportBoundsService';
import { ViewportTransformService } from '../domain/ViewportTransformService';
import { ViewportDimensionsService } from '../domain/ViewportDimensionsService';
import type { PointPosition } from '@/utils/pathCalculations';

describe('MapViewportUseCase', () => {
  let useCase: MapViewportUseCase;
  let boundsService: ViewportBoundsService;
  let transformService: ViewportTransformService;
  let dimensionsService: ViewportDimensionsService;

  const mockConfig = {
    svgSize: { width: 2000, height: 1500 },
    scale: 1,
    paddingRatio: 0.1,
  };

  beforeEach(() => {
    boundsService = new ViewportBoundsService();
    transformService = new ViewportTransformService();
    dimensionsService = new ViewportDimensionsService();
    useCase = new MapViewportUseCase(boundsService, transformService, dimensionsService);
  });

  describe('calculateBounds', () => {
    it('devrait calculer les bounds correctement', () => {
      const bounds = useCase.calculateBounds(1920, 1080, mockConfig);
      
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBe(2000);
      expect(bounds!.height).toBe(1500);
    });

    it('devrait retourner null pour des dimensions invalides', () => {
      const bounds = useCase.calculateBounds(0, 0, mockConfig);
      expect(bounds).toBeNull();
    });
  });

  describe('calculatePadding', () => {
    it('devrait calculer le padding correctement', () => {
      const padding = useCase.calculatePadding(mockConfig);
      
      expect(padding.paddingX).toBe(200);
      expect(padding.paddingY).toBe(150);
    });
  });

  describe('calculateTransform', () => {
    it('devrait calculer la transformation pour un point valide', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      const transform = useCase.calculateTransform(point, 1920, 1080, mockConfig);
      
      expect(transform).not.toBeNull();
      expect(transform!.scale).toBe(1);
    });

    it('devrait retourner null pour un point null', () => {
      const transform = useCase.calculateTransform(null, 1920, 1080, mockConfig);
      expect(transform).toBeNull();
    });

    it('devrait retourner null pour des dimensions invalides', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      const transform = useCase.calculateTransform(point, 0, 0, mockConfig);
      expect(transform).toBeNull();
    });
  });

  describe('getViewportDimensions', () => {
    it('devrait retourner les dimensions du viewport', () => {
      const dimensions = useCase.getViewportDimensions();
      
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
    });
  });

  describe('isValidDimensions', () => {
    it('devrait valider les dimensions correctement', () => {
      expect(useCase.isValidDimensions({ width: 1920, height: 1080 })).toBe(true);
      expect(useCase.isValidDimensions({ width: 0, height: 1080 })).toBe(false);
    });
  });
});

