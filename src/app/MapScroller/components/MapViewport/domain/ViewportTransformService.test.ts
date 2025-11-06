import { ViewportTransformService } from './ViewportTransformService';
import type { PointPosition } from '@/utils/pathCalculations';

describe('ViewportTransformService', () => {
  let service: ViewportTransformService;

  beforeEach(() => {
    service = new ViewportTransformService();
  });

  describe('calculateTransform', () => {
    it('devrait calculer la transformation pour centrer un point', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      const transform = service.calculateTransform(
        point,
        1920,
        1080,
        { width: 2000, height: 1500 },
        1,
        0.1,
        undefined
      );

      expect(transform).toHaveProperty('translateX');
      expect(transform).toHaveProperty('translateY');
      expect(transform.scale).toBe(1);
      expect(typeof transform.translateX).toBe('number');
      expect(typeof transform.translateY).toBe('number');
    });

    it('devrait utiliser les bounds pré-calculées si fournies', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      const bounds = {
        width: 2000,
        height: 1500,
        paddedWidth: 2400,
        paddedHeight: 1800,
        maxX: 480,
        maxY: 720,
      };

      const transform = service.calculateTransform(
        point,
        1920,
        1080,
        { width: 2000, height: 1500 },
        1,
        0.1,
        bounds
      );

      expect(transform).toBeDefined();
    });
  });

  describe('isValidParams', () => {
    it('devrait retourner true pour des paramètres valides', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      expect(service.isValidParams(point, 1920, 1080)).toBe(true);
    });

    it('devrait retourner false si point est null', () => {
      expect(service.isValidParams(null, 1920, 1080)).toBe(false);
    });

    it('devrait retourner false si windowWidth est 0', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      expect(service.isValidParams(point, 0, 1080)).toBe(false);
    });

    it('devrait retourner false si windowHeight est 0', () => {
      const point: PointPosition = { x: 1000, y: 750 };
      expect(service.isValidParams(point, 1920, 0)).toBe(false);
    });
  });
});

