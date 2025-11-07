import { ScrollVelocityService } from './ScrollVelocityService';

describe('ScrollVelocityService', () => {
  let service: ScrollVelocityService;
  let mockTime: number;

  beforeEach(() => {
    service = new ScrollVelocityService(0.92, 0.1);
    mockTime = 1000;
  });

  describe('updateVelocity', () => {
    it('devrait initialiser la vélocité à 0 lors de la première mise à jour', () => {
      service.updateVelocity(100, mockTime);
      expect(service.getVelocity()).toBe(0);
    });

    it('devrait calculer la vélocité basée sur le changement de scrollY', () => {
      service.updateVelocity(100, mockTime);
      service.updateVelocity(200, mockTime + 100); // 100px en 100ms = 1px/ms
      
      const velocity = service.getVelocity();
      expect(velocity).toBeGreaterThan(0);
      expect(velocity).toBeLessThanOrEqual(0.1); // Max velocity
    });

    it('devrait gérer les valeurs négatives (scroll vers le haut)', () => {
      service.updateVelocity(200, mockTime);
      service.updateVelocity(100, mockTime + 100); // -100px en 100ms
      
      const velocity = service.getVelocity();
      expect(velocity).toBeLessThan(0);
      expect(velocity).toBeGreaterThanOrEqual(-0.1); // Max velocity
    });

    it('devrait limiter la vélocité maximale', () => {
      service.updateVelocity(0, mockTime);
      // Simuler un très grand changement
      service.updateVelocity(10000, mockTime + 10); // 10000px en 10ms = très rapide
      
      const velocity = service.getAbsoluteVelocity();
      expect(velocity).toBeLessThanOrEqual(0.1);
    });
  });

  describe('updateVelocityFromWheel', () => {
    it('devrait mettre à jour la vélocité depuis un événement wheel', () => {
      service.updateVelocityFromWheel(100, mockTime);
      
      const velocity = service.getVelocity();
      expect(velocity).not.toBe(0);
      expect(Math.abs(velocity)).toBeLessThanOrEqual(0.1);
    });

    it('devrait gérer les valeurs négatives (scroll vers le haut)', () => {
      service.updateVelocityFromWheel(-100, mockTime);
      
      const velocity = service.getVelocity();
      expect(velocity).toBeLessThan(0);
    });
  });

  describe('applyFriction', () => {
    it('devrait réduire la vélocité avec la friction', () => {
      service.updateVelocityFromWheel(100, mockTime);
      const initialVelocity = service.getAbsoluteVelocity();
      
      service.applyFriction();
      const velocityAfterFriction = service.getAbsoluteVelocity();
      
      expect(velocityAfterFriction).toBeLessThan(initialVelocity);
    });

    it('devrait réduire progressivement la vélocité à chaque application de friction', () => {
      service.updateVelocityFromWheel(100, mockTime);
      const v1 = service.getAbsoluteVelocity();
      
      service.applyFriction();
      const v2 = service.getAbsoluteVelocity();
      
      service.applyFriction();
      const v3 = service.getAbsoluteVelocity();
      
      expect(v1).toBeGreaterThan(v2);
      expect(v2).toBeGreaterThan(v3);
    });

    it('devrait tendre vers 0 après plusieurs applications de friction', () => {
      service.updateVelocityFromWheel(100, mockTime);
      
      // Appliquer la friction plusieurs fois
      for (let i = 0; i < 50; i++) {
        service.applyFriction();
      }
      
      const velocity = service.getAbsoluteVelocity();
      // Avec friction 0.92, après 50 itérations : 0.92^50 ≈ 0.00108
      // On accepte une valeur proche de 0
      expect(velocity).toBeLessThan(0.002);
    });
  });

  describe('getVelocity', () => {
    it('devrait retourner la vélocité actuelle', () => {
      expect(service.getVelocity()).toBe(0);
      
      service.updateVelocityFromWheel(50, mockTime);
      expect(service.getVelocity()).not.toBe(0);
    });
  });

  describe('getAbsoluteVelocity', () => {
    it('devrait retourner la valeur absolue de la vélocité', () => {
      service.updateVelocityFromWheel(-100, mockTime);
      
      const velocity = service.getVelocity();
      const absoluteVelocity = service.getAbsoluteVelocity();
      
      expect(absoluteVelocity).toBe(Math.abs(velocity));
      expect(absoluteVelocity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('devrait réinitialiser la vélocité à 0', () => {
      service.updateVelocityFromWheel(100, mockTime);
      expect(service.getVelocity()).not.toBe(0);
      
      service.reset();
      expect(service.getVelocity()).toBe(0);
    });

    it('devrait réinitialiser les valeurs internes', () => {
      service.updateVelocity(100, mockTime);
      service.updateVelocity(200, mockTime + 100);
      
      service.reset();
      
      // Après reset, la prochaine mise à jour devrait être traitée comme la première
      service.updateVelocity(300, mockTime + 200);
      expect(service.getVelocity()).toBe(0);
    });
  });

  describe('isSignificant', () => {
    it('devrait retourner false si la vélocité est en dessous du seuil', () => {
      service.reset();
      expect(service.isSignificant()).toBe(false);
    });

    it('devrait retourner true si la vélocité est au-dessus du seuil', () => {
      service.updateVelocityFromWheel(100, mockTime);
      expect(service.isSignificant(0.001)).toBe(true);
    });

    it('devrait utiliser le seuil par défaut si non spécifié', () => {
      service.updateVelocityFromWheel(100, mockTime);
      expect(service.isSignificant()).toBe(true);
    });
  });

  describe('Configuration personnalisée', () => {
    it('devrait utiliser le coefficient de friction personnalisé', () => {
      const customService = new ScrollVelocityService(0.95, 0.1); // Friction plus faible
      customService.updateVelocityFromWheel(100, mockTime);
      
      const v1 = customService.getAbsoluteVelocity();
      customService.applyFriction();
      const v2 = customService.getAbsoluteVelocity();
      
      // Avec friction 0.95, la décroissance devrait être plus lente qu'avec 0.92
      const decay1 = v1 - v2;
      
      const defaultService = new ScrollVelocityService(0.92, 0.1);
      defaultService.updateVelocityFromWheel(100, mockTime);
      const v3 = defaultService.getAbsoluteVelocity();
      defaultService.applyFriction();
      const v4 = defaultService.getAbsoluteVelocity();
      const decay2 = v3 - v4;
      
      // La décroissance avec 0.95 devrait être plus lente (plus petite différence)
      expect(decay1).toBeLessThan(decay2);
    });

    it('devrait utiliser la vélocité maximale personnalisée', () => {
      const customService = new ScrollVelocityService(0.92, 0.05); // Max velocity plus faible
      customService.updateVelocityFromWheel(10000, mockTime); // Très grand deltaY
      
      const velocity = customService.getAbsoluteVelocity();
      expect(velocity).toBeLessThanOrEqual(0.05);
    });
  });
});

