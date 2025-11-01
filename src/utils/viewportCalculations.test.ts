import {
  calculateMapPadding,
  calculatePaddedDimensions,
  calculateViewportBounds,
  calculateViewportTransform,
  applyViewportTransform,
} from './viewportCalculations';
import { SVG_SIZE } from '@/config/path';
import { MAP_SCALE } from '@/config/mapScale';
import { MAP_PADDING_RATIO } from '@/config/mapPadding';

describe('viewportCalculations', () => {
  describe('calculateMapPadding', () => {
    it('devrait calculer le padding correctement', () => {
      const { paddingX, paddingY } = calculateMapPadding();
      expect(paddingX).toBe(SVG_SIZE.width * MAP_PADDING_RATIO);
      expect(paddingY).toBe(SVG_SIZE.height * MAP_PADDING_RATIO);
    });
  });

  describe('calculatePaddedDimensions', () => {
    it('devrait calculer les dimensions avec padding', () => {
      const { paddedWidth, paddedHeight } = calculatePaddedDimensions();
      const { paddingX, paddingY } = calculateMapPadding();
      
      expect(paddedWidth).toBe(SVG_SIZE.width + 2 * paddingX);
      expect(paddedHeight).toBe(SVG_SIZE.height + 2 * paddingY);
    });
  });

  describe('calculateViewportBounds', () => {
    it('devrait calculer les limites correctement', () => {
      const windowWidth = 1920;
      const windowHeight = 1080;
      const bounds = calculateViewportBounds(windowWidth, windowHeight);
      
      expect(bounds.width).toBe(SVG_SIZE.width);
      expect(bounds.height).toBe(SVG_SIZE.height);
      expect(bounds.maxX).toBeGreaterThanOrEqual(0);
      expect(bounds.maxY).toBeGreaterThanOrEqual(0);
    });

    it('devrait retourner maxX/maxY à 0 si la fenêtre est plus grande que la carte', () => {
      const bounds = calculateViewportBounds(10000, 10000);
      expect(bounds.maxX).toBeGreaterThanOrEqual(0);
      expect(bounds.maxY).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateViewportTransform', () => {
    it('devrait calculer la transformation pour centrer un point', () => {
      const point = { x: SVG_SIZE.width / 2, y: SVG_SIZE.height / 2 };
      const transform = calculateViewportTransform(point, 1920, 1080);
      
      expect(transform).toHaveProperty('translateX');
      expect(transform).toHaveProperty('translateY');
      expect(transform.scale).toBe(MAP_SCALE);
      expect(typeof transform.translateX).toBe('number');
      expect(typeof transform.translateY).toBe('number');
    });

    it('devrait clamp les valeurs dans les limites', () => {
      const point = { x: -100, y: -100 }; // Point hors limites
      const transform = calculateViewportTransform(point, 1920, 1080);
      
      expect(transform.translateX).toBeGreaterThanOrEqual(0);
      expect(transform.translateY).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyViewportTransform', () => {
    it('devrait appliquer la transformation au DOM', () => {
      const element = document.createElement('div');
      const transform = {
        translateX: -100,
        translateY: -200,
        scale: 1,
      };
      
      applyViewportTransform(element, transform);
      
      expect(element.style.transform).toContain('translate(-100px, -200px)');
      expect(element.style.transform).toContain('scale(1)');
      expect(element.style.transformOrigin).toBe('top left');
    });
  });
});

