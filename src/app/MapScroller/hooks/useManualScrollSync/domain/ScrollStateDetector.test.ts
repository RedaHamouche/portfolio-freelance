import { ScrollStateDetector } from './ScrollStateDetector';

describe('ScrollStateDetector', () => {
  let detector: ScrollStateDetector;

  beforeEach(() => {
    detector = new ScrollStateDetector(150);
  });

  describe('isScrollEnded', () => {
    it('devrait retourner false si le temps écoulé est inférieur au seuil', () => {
      const lastScrollTime = 1000;
      const currentTime = 1100; // 100ms écoulés
      
      expect(detector.isScrollEnded(lastScrollTime, currentTime)).toBe(false);
    });

    it('devrait retourner true si le temps écoulé est supérieur ou égal au seuil', () => {
      const lastScrollTime = 1000;
      const currentTime = 1150; // 150ms écoulés
      
      expect(detector.isScrollEnded(lastScrollTime, currentTime)).toBe(true);
    });

    it('devrait retourner true si beaucoup de temps s\'est écoulé', () => {
      const lastScrollTime = 1000;
      const currentTime = 2000; // 1000ms écoulés
      
      expect(detector.isScrollEnded(lastScrollTime, currentTime)).toBe(true);
    });
  });

  describe('getTimeSinceLastScroll', () => {
    it('devrait calculer correctement le temps écoulé', () => {
      const lastScrollTime = 1000;
      const currentTime = 1150;
      
      expect(detector.getTimeSinceLastScroll(lastScrollTime, currentTime)).toBe(150);
    });

    it('devrait gérer les cas où currentTime est antérieur à lastScrollTime', () => {
      const lastScrollTime = 2000;
      const currentTime = 1000;
      
      // Devrait retourner une valeur négative (cas anormal mais possible)
      expect(detector.getTimeSinceLastScroll(lastScrollTime, currentTime)).toBe(-1000);
    });
  });
});

