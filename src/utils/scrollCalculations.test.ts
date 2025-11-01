import {
  computeScrollProgress,
  calculateFakeScrollHeight,
  calculateMaxScroll,
  calculateScrollYFromProgress,
  normalizeScrollY,
} from './scrollCalculations';
import { SCROLL_CONFIG } from '@/config/scroll';

describe('scrollCalculations', () => {
  describe('computeScrollProgress', () => {
    it('devrait retourner 0 quand scrollY est 0 (sens inversé)', () => {
      expect(computeScrollProgress(0, 1000)).toBe(0);
    });

    it('devrait retourner 0.5 quand scrollY est au milieu', () => {
      expect(computeScrollProgress(500, 1000)).toBeCloseTo(0.5, 5);
    });

    it('devrait retourner ~0 quand scrollY est égal à maxScroll (boucle infini, sens inversé)', () => {
      // Avec le scroll infini, quand scrollY = maxScroll, on revient au début (progress = 0)
      expect(computeScrollProgress(1000, 1000)).toBeCloseTo(0, 5);
    });

    it('devrait gérer le scroll infini avec modulo', () => {
      const maxScroll = 1000;
      const scrollY = 1500; // Dépassement
      const progress = computeScrollProgress(scrollY, maxScroll);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('devrait retourner 0 si maxScroll est <= 0', () => {
      expect(computeScrollProgress(100, 0)).toBe(0);
      expect(computeScrollProgress(100, -10)).toBe(0);
    });
  });

  describe('calculateFakeScrollHeight', () => {
    it('devrait calculer correctement la hauteur basée sur SCROLL_PER_PX', () => {
      const pathLength = 1000;
      const expected = Math.round(pathLength * SCROLL_CONFIG.SCROLL_PER_PX);
      expect(calculateFakeScrollHeight(pathLength)).toBe(expected);
    });

    it('devrait retourner un entier arrondi', () => {
      const result = calculateFakeScrollHeight(1000);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('calculateMaxScroll', () => {
    it('devrait calculer correctement maxScroll', () => {
      const fakeScrollHeight = 1500;
      const windowHeight = 800;
      expect(calculateMaxScroll(fakeScrollHeight, windowHeight)).toBe(700);
    });

    it('devrait retourner au moins 1 même si le calcul donne moins', () => {
      expect(calculateMaxScroll(500, 800)).toBe(1);
    });
  });

  describe('calculateScrollYFromProgress', () => {
    it('devrait calculer scrollY à maxScroll quand progress est 1 (sens inversé)', () => {
      const maxScroll = 1000;
      expect(calculateScrollYFromProgress(1, maxScroll)).toBe(maxScroll);
    });

    it('devrait calculer scrollY à 0 quand progress est 0 (sens inversé)', () => {
      expect(calculateScrollYFromProgress(0, 1000)).toBe(0);
    });

    it('devrait calculer scrollY au milieu quand progress est 0.5', () => {
      const maxScroll = 1000;
      expect(calculateScrollYFromProgress(0.5, maxScroll)).toBe(500);
    });
  });

  describe('normalizeScrollY', () => {
    it('devrait boucler vers la fin quand scrollY est négatif', () => {
      // Si on dépasse vers le haut (négatif), on boucle vers la fin
      const result = normalizeScrollY(-10, 1000);
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBe(1000 - SCROLL_CONFIG.SCROLL_MARGINS.TOP);
      expect(result.normalizedY).toBe(1000 - SCROLL_CONFIG.SCROLL_MARGINS.TOP);
    });

    it('devrait boucler vers le début quand scrollY dépasse maxScroll', () => {
      // Si on dépasse vers le bas, on boucle vers le début
      const maxScroll = 1000;
      const result = normalizeScrollY(maxScroll + 10, maxScroll);
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBe(SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM);
      expect(result.normalizedY).toBe(SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM);
    });

    it('devrait boucler quand scrollY est à 0 (au début)', () => {
      // À scrollY = 0, on boucle vers la fin
      const result = normalizeScrollY(0, 1000);
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBe(1000 - SCROLL_CONFIG.SCROLL_MARGINS.TOP);
    });

    it('devrait boucler quand scrollY est à maxScroll - 1 (à la fin)', () => {
      // À scrollY = maxScroll - 1, on boucle vers le début
      const maxScroll = 1000;
      const result = normalizeScrollY(maxScroll - 1, maxScroll);
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBe(SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM);
    });

    it('ne devrait pas corriger scrollY si dans les limites', () => {
      const result = normalizeScrollY(500, 1000);
      expect(result.shouldCorrect).toBe(false);
      expect(result.normalizedY).toBe(500);
      expect(result.correctionY).toBeUndefined();
    });
  });
});

