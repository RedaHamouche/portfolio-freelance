import { ZoomService } from './ZoomService';

describe('ZoomService', () => {
  let zoomService: ZoomService;
  const baseScale = 1.0;
  const zoomOutFactor = 0.1; // 10% de dézoom pendant le scroll

  beforeEach(() => {
    zoomService = new ZoomService(zoomOutFactor);
  });

  describe('calculateZoom', () => {
    it('devrait retourner le scale de base quand isScrolling est false', () => {
      const result = zoomService.calculateZoom(baseScale, false);
      expect(result).toBe(baseScale);
    });

    it('devrait retourner un scale réduit quand isScrolling est true', () => {
      const result = zoomService.calculateZoom(baseScale, true);
      const expectedScale = baseScale * (1 - zoomOutFactor);
      expect(result).toBe(expectedScale);
    });

    it('devrait appliquer le facteur de dézoom correctement', () => {
      const customScale = 2.0;
      const result = zoomService.calculateZoom(customScale, true);
      const expectedScale = customScale * (1 - zoomOutFactor);
      expect(result).toBe(expectedScale);
    });

    it('devrait gérer différents facteurs de dézoom', () => {
      const customFactor = 0.15; // 15% de dézoom
      const customService = new ZoomService(customFactor);
      const result = customService.calculateZoom(baseScale, true);
      const expectedScale = baseScale * (1 - customFactor);
      expect(result).toBe(expectedScale);
    });

    it('ne devrait jamais retourner un scale négatif ou zéro', () => {
      const largeFactor = 0.99; // 99% de dézoom (extrême)
      const extremeService = new ZoomService(largeFactor);
      const result = extremeService.calculateZoom(baseScale, true);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getZoomOutFactor', () => {
    it('devrait retourner le facteur de dézoom configuré', () => {
      expect(zoomService.getZoomOutFactor()).toBe(zoomOutFactor);
    });
  });
});

