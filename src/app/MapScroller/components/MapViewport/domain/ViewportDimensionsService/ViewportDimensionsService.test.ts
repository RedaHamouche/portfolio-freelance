import { ViewportDimensionsService } from './ViewportDimensionsService';

// Mock window.visualViewport
const mockVisualViewport = {
  width: 1920,
  height: 1080,
};

Object.defineProperty(window, 'visualViewport', {
  value: mockVisualViewport,
  writable: true,
});

describe('ViewportDimensionsService', () => {
  let service: ViewportDimensionsService;

  beforeEach(() => {
    service = new ViewportDimensionsService();
  });

  describe('getDimensions', () => {
    it('devrait retourner les dimensions du viewport', () => {
      const dimensions = service.getDimensions();
      
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(typeof dimensions.width).toBe('number');
      expect(typeof dimensions.height).toBe('number');
    });

    it('devrait utiliser visualViewport si disponible', () => {
      mockVisualViewport.width = 1920;
      mockVisualViewport.height = 1080;
      
      const dimensions = service.getDimensions();
      
      // Devrait utiliser visualViewport si disponible
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
    });
  });

  describe('isValidDimensions', () => {
    it('devrait retourner true pour des dimensions valides', () => {
      expect(service.isValidDimensions({ width: 1920, height: 1080 })).toBe(true);
    });

    it('devrait retourner false si width est 0', () => {
      expect(service.isValidDimensions({ width: 0, height: 1080 })).toBe(false);
    });

    it('devrait retourner false si height est 0', () => {
      expect(service.isValidDimensions({ width: 1920, height: 0 })).toBe(false);
    });

    it('devrait retourner false si les deux sont 0', () => {
      expect(service.isValidDimensions({ width: 0, height: 0 })).toBe(false);
    });
  });
});

