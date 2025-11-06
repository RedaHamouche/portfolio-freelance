import { ViewportBoundsService } from './ViewportBoundsService';

describe('ViewportBoundsService', () => {
  let service: ViewportBoundsService;

  beforeEach(() => {
    service = new ViewportBoundsService();
  });

  describe('calculateBounds', () => {
    it('devrait calculer les bounds correctement', () => {
      const bounds = service.calculateBounds(
        1920,
        1080,
        { width: 2000, height: 1500 },
        1,
        0.1
      );

      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBe(2000);
      expect(bounds!.height).toBe(1500);
      expect(bounds!.maxX).toBeGreaterThanOrEqual(0);
      expect(bounds!.maxY).toBeGreaterThanOrEqual(0);
    });

    it('devrait retourner null si les dimensions sont invalides', () => {
      const bounds = service.calculateBounds(0, 0, { width: 2000, height: 1500 }, 1, 0.1);
      expect(bounds).toBeNull();
    });

    it('devrait retourner null si windowWidth est 0', () => {
      const bounds = service.calculateBounds(0, 1080, { width: 2000, height: 1500 }, 1, 0.1);
      expect(bounds).toBeNull();
    });

    it('devrait retourner null si windowHeight est 0', () => {
      const bounds = service.calculateBounds(1920, 0, { width: 2000, height: 1500 }, 1, 0.1);
      expect(bounds).toBeNull();
    });
  });

  describe('calculatePadding', () => {
    it('devrait calculer le padding correctement', () => {
      const padding = service.calculatePadding({ width: 2000, height: 1500 }, 0.1);
      
      expect(padding.paddingX).toBe(200);
      expect(padding.paddingY).toBe(150);
    });

    it('devrait gérer un paddingRatio de 0', () => {
      const padding = service.calculatePadding({ width: 2000, height: 1500 }, 0);
      
      expect(padding.paddingX).toBe(0);
      expect(padding.paddingY).toBe(0);
    });
  });

  describe('isValidDimensions', () => {
    it('devrait retourner true pour des dimensions valides', () => {
      expect(service.isValidDimensions(1920, 1080)).toBe(true);
    });

    it('devrait retourner false si width est 0', () => {
      expect(service.isValidDimensions(0, 1080)).toBe(false);
    });

    it('devrait retourner false si height est 0', () => {
      expect(service.isValidDimensions(1920, 0)).toBe(false);
    });

    it('devrait retourner false si les deux sont 0', () => {
      expect(service.isValidDimensions(0, 0)).toBe(false);
    });
  });
});

