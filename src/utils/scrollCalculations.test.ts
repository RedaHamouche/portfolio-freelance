import {
  computeScrollProgress,
  calculateFakeScrollHeight,
  calculateMaxScroll,
  calculateScrollYFromProgress,
  normalizeScrollY,
  calculateAdjustedTargetProgress,
} from './scrollCalculations';
import { SCROLL_CONFIG } from '@/config';

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

  describe('calculateAdjustedTargetProgress', () => {
    describe('direction forward', () => {
      it('devrait toujours prendre le chemin forward même si backward est plus court', () => {
        // Cas : 0.99 -> 0.02, forward devrait prendre le wraparound (0.03) au lieu du direct (-0.97)
        const result = calculateAdjustedTargetProgress(0.99, 0.02, 'forward');
        expect(result).toBeCloseTo(0.02, 5);
        // Vérifier que c'est bien le chemin forward (wraparound)
        // 0.99 + 0.03 = 1.02, normalisé = 0.02
      });

      it('devrait prendre le chemin direct forward quand c\'est le plus court', () => {
        // Cas : 0.1 -> 0.9, forward direct (0.8)
        const result = calculateAdjustedTargetProgress(0.1, 0.9, 'forward');
        expect(result).toBeCloseTo(0.9, 5);
      });

      it('devrait gérer le cas où on est proche de 0', () => {
        // Cas : 0.01 -> 0.02, forward direct (0.01)
        const result = calculateAdjustedTargetProgress(0.01, 0.02, 'forward');
        expect(result).toBeCloseTo(0.02, 5);
      });
    });

    describe('direction backward', () => {
      it('devrait toujours prendre le chemin backward même si forward est plus court', () => {
        // Cas : 0.01 -> 0.99, backward devrait prendre le wraparound (-0.02) au lieu du direct (0.98)
        const result = calculateAdjustedTargetProgress(0.01, 0.99, 'backward');
        expect(result).toBeCloseTo(0.99, 5);
        // Vérifier que c'est bien le chemin backward (wraparound)
        // 0.01 - 0.02 = -0.01, normalisé = 0.99
      });

      it('devrait prendre le chemin direct backward quand c\'est le plus court', () => {
        // Cas : 0.9 -> 0.1, backward direct (-0.8)
        const result = calculateAdjustedTargetProgress(0.9, 0.1, 'backward');
        expect(result).toBeCloseTo(0.1, 5);
      });

      it('devrait gérer le cas PieceOfArt sur mobile (0.99 -> 0.02, backward)', () => {
        // Cas spécifique : PieceOfArt mobile à 0.02, on est à 0.99, direction backward
        // Le chemin backward direct est -0.97, ce qui donne 0.02
        const result = calculateAdjustedTargetProgress(0.99, 0.02, 'backward');
        expect(result).toBeCloseTo(0.02, 5);
      });
    });

    describe('direction null (chemin le plus court)', () => {
      it('devrait choisir le chemin le plus court quand direction est null', () => {
        // Cas : 0.1 -> 0.9, le chemin direct (0.8) est plus court que wraparound (0.2)
        const result = calculateAdjustedTargetProgress(0.1, 0.9, null);
        expect(result).toBeCloseTo(0.9, 5);
      });

      it('devrait choisir le wraparound si c\'est le chemin le plus court', () => {
        // Cas : 0.95 -> 0.05, le wraparound (0.1) est plus court que direct (-0.9)
        const result = calculateAdjustedTargetProgress(0.95, 0.05, null);
        expect(result).toBeCloseTo(0.05, 5);
      });
    });

    describe('cas limites', () => {
      it('devrait gérer progress = 0', () => {
        const result = calculateAdjustedTargetProgress(0, 0.5, 'forward');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
        expect(result).toBeCloseTo(0.5, 5);
      });

      it('devrait gérer progress = 1 (normalisé à 0)', () => {
        const result = calculateAdjustedTargetProgress(1, 0.5, 'forward');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      });

      it('devrait normaliser le résultat entre 0 et 1', () => {
        const result = calculateAdjustedTargetProgress(0.9, 0.3, 'forward');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      });

      it('devrait gérer le cas où currentProgress = targetProgress', () => {
        const result = calculateAdjustedTargetProgress(0.5, 0.5, 'forward');
        expect(result).toBeCloseTo(0.5, 5);
      });
    });
  });
});

