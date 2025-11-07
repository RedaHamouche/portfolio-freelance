import { ScrollEasingService, EasingFunctions } from './ScrollEasingService';

describe('ScrollEasingService', () => {
  let service: ScrollEasingService;

  beforeEach(() => {
    service = new ScrollEasingService(0.12, EasingFunctions.linear, 0.0001);
  });

  describe('calculateCircularDelta', () => {
    it('devrait calculer la différence normale entre deux valeurs', () => {
      expect(service.calculateCircularDelta(0.2, 0.5)).toBeCloseTo(0.3, 5);
      expect(service.calculateCircularDelta(0.5, 0.8)).toBeCloseTo(0.3, 5);
    });

    it('devrait gérer le wraparound circulaire (de 0.95 à 0.05)', () => {
      const delta = service.calculateCircularDelta(0.95, 0.05);
      // La distance devrait être 0.1 (le plus court chemin), pas 0.9
      expect(delta).toBeCloseTo(0.1, 5);
    });

    it('devrait gérer le wraparound circulaire inverse (de 0.05 à 0.95)', () => {
      const delta = service.calculateCircularDelta(0.05, 0.95);
      // La distance devrait être -0.1 (le plus court chemin), pas -0.9
      expect(delta).toBeCloseTo(-0.1, 5);
    });

    it('devrait gérer le cas où current = target', () => {
      expect(service.calculateCircularDelta(0.5, 0.5)).toBe(0);
    });
  });

  describe('interpolate', () => {
    it('devrait interpoler progressivement vers la cible', () => {
      const result = service.interpolate(0.2, 0.5);
      expect(result.newValue).toBeGreaterThan(0.2);
      expect(result.newValue).toBeLessThan(0.5);
      expect(result.shouldContinue).toBe(true);
    });

    it('devrait arrêter l\'animation quand la différence est très petite', () => {
      const result = service.interpolate(0.5, 0.50005);
      expect(result.shouldContinue).toBe(false);
      expect(result.newValue).toBeCloseTo(0.50005, 5);
    });

    it('devrait gérer le wraparound lors de l\'interpolation', () => {
      const result = service.interpolate(0.95, 0.05);
      expect(result.newValue).toBeGreaterThanOrEqual(0);
      expect(result.newValue).toBeLessThanOrEqual(1);
      expect(result.shouldContinue).toBe(true);
    });

    it('devrait normaliser la valeur entre 0 et 1', () => {
      const result = service.interpolate(0.9, 0.1);
      expect(result.newValue).toBeGreaterThanOrEqual(0);
      expect(result.newValue).toBeLessThan(1);
    });
  });

  describe('shouldContinueAnimation', () => {
    it('devrait retourner true si la différence est significative', () => {
      expect(service.shouldContinueAnimation(0.2, 0.5)).toBe(true);
    });

    it('devrait retourner false si la différence est très petite', () => {
      expect(service.shouldContinueAnimation(0.5, 0.50005)).toBe(false);
    });

    it('devrait retourner false si current = target', () => {
      expect(service.shouldContinueAnimation(0.5, 0.5)).toBe(false);
    });
  });
});

