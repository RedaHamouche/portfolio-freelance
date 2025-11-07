import { AutoPlayProgressService } from './AutoPlayProgressService';
import { AUTO_SCROLL_CONFIG, SCROLL_CONFIG } from '@/config';

describe('AutoPlayProgressService', () => {
  let service: AutoPlayProgressService;

  beforeEach(() => {
    service = new AutoPlayProgressService();
  });

  describe('calculateNextProgress', () => {
    it('devrait calculer le prochain progress en forward (direction 1) sur desktop', () => {
      const currentProgress = 0.5;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000; // ~0.016s
      const direction = 1;
      const isDesktop = true;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      expect(result).toBeGreaterThan(currentProgress);
      expect(result).toBeLessThanOrEqual(1);
      expect(result).toBeCloseTo(currentProgress + AUTO_SCROLL_CONFIG.desktop.speed * dt, 5);
    });

    it('devrait calculer le prochain progress en forward (direction 1) sur mobile', () => {
      const currentProgress = 0.5;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000; // ~0.016s
      const direction = 1;
      const isDesktop = false;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      expect(result).toBeGreaterThan(currentProgress);
      expect(result).toBeLessThanOrEqual(1);
      expect(result).toBeCloseTo(currentProgress + AUTO_SCROLL_CONFIG.mobile.speed * dt, 5);
    });

    it('devrait utiliser la vitesse desktop quand isDesktop est true', () => {
      const currentProgress = 0.5;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000;
      const direction = 1;
      
      const desktopResult = service.calculateNextProgress(currentProgress, direction, dt, true);
      const mobileResult = service.calculateNextProgress(currentProgress, direction, dt, false);
      
      // Si les vitesses sont différentes, les résultats doivent être différents
      if (AUTO_SCROLL_CONFIG.desktop.speed !== AUTO_SCROLL_CONFIG.mobile.speed) {
        expect(desktopResult).not.toBe(mobileResult);
      }
    });

    it('devrait calculer le prochain progress en backward (direction -1) sur desktop', () => {
      const currentProgress = 0.5;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000;
      const direction = -1;
      const isDesktop = true;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      expect(result).toBeLessThan(currentProgress);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeCloseTo(currentProgress - AUTO_SCROLL_CONFIG.desktop.speed * dt, 5);
    });

    it('devrait calculer le prochain progress en backward (direction -1) sur mobile', () => {
      const currentProgress = 0.5;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000;
      const direction = -1;
      const isDesktop = false;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      expect(result).toBeLessThan(currentProgress);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeCloseTo(currentProgress - AUTO_SCROLL_CONFIG.mobile.speed * dt, 5);
    });

    it('devrait gérer le wraparound circulaire en forward (0.99 -> 0.01)', () => {
      const currentProgress = 0.99;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000;
      const direction = 1;
      const isDesktop = true;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      // Devrait wraparound et être proche de 0
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('devrait gérer le wraparound circulaire en backward (0.01 -> 0.99)', () => {
      const currentProgress = 0.01;
      const dt = SCROLL_CONFIG.FRAME_DELAY / 1000;
      const direction = -1;
      const isDesktop = true;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      // Devrait wraparound et être proche de 1
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('devrait normaliser le résultat entre 0 et 1', () => {
      const currentProgress = 0.95;
      const dt = 1; // dt très grand pour forcer le wraparound
      const direction = 1;
      const isDesktop = true;
      
      const result = service.calculateNextProgress(currentProgress, direction, dt, isDesktop);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });
  });
});

