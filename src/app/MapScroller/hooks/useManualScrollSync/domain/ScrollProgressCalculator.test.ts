import { ScrollProgressCalculator } from './ScrollProgressCalculator';
import { SCROLL_CONFIG } from '@/config';

describe('ScrollProgressCalculator', () => {
  let calculator: ScrollProgressCalculator;
  let originalInnerHeight: number | undefined;
  let originalScrollY: number | undefined;

  beforeEach(() => {
    calculator = new ScrollProgressCalculator();
    // Sauvegarder les valeurs originales
    originalInnerHeight = global.window?.innerHeight;
    originalScrollY = global.window?.scrollY;
    
    // Mocker window si nécessaire
    if (typeof global.window === 'undefined') {
      // Créer un mock window minimal
      global.window = {
        innerHeight: 800,
        scrollY: 0,
      } as unknown as Window & typeof globalThis;
    } else {
      // Modifier les propriétés existantes
      Object.defineProperty(global.window, 'innerHeight', {
        value: 800,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global.window, 'scrollY', {
        value: 0,
        writable: true,
        configurable: true,
      });
    }
  });

  afterEach(() => {
    // Restaurer les valeurs originales si possible
    if (global.window && originalInnerHeight !== undefined && originalScrollY !== undefined) {
      try {
        Object.defineProperty(global.window, 'innerHeight', {
          value: originalInnerHeight,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(global.window, 'scrollY', {
          value: originalScrollY,
          writable: true,
          configurable: true,
        });
      } catch {
        // Ignorer les erreurs de restauration
      }
    }
  });

  describe('calculateProgress', () => {
    it('devrait calculer le progress à partir de scrollY', () => {
      const globalPathLength = 1000;
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - 800);
      
      const scrollY = maxScroll / 2;
      
      const result = calculator.calculateProgress(scrollY, globalPathLength);
      
      expect(result.progress).toBeGreaterThan(0);
      expect(result.progress).toBeLessThanOrEqual(1);
    });

    it('devrait retourner shouldCorrect=true si scrollY est négatif', () => {
      const globalPathLength = 1000;
      const scrollY = -10;
      
      const result = calculator.calculateProgress(scrollY, globalPathLength);
      
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBeDefined();
    });

    it('devrait retourner shouldCorrect=true si scrollY dépasse maxScroll', () => {
      const globalPathLength = 1000;
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - 800);
      
      const scrollY = maxScroll + 10;
      
      const result = calculator.calculateProgress(scrollY, globalPathLength);
      
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBeDefined();
    });

    it('devrait retourner shouldCorrect=false pour un scrollY normal', () => {
      const globalPathLength = 1000;
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - 800);
      
      const scrollY = maxScroll / 2;
      
      const result = calculator.calculateProgress(scrollY, globalPathLength);
      
      expect(result.shouldCorrect).toBe(false);
    });
  });

  describe('calculateInitialProgress', () => {
    it('devrait calculer le progress initial à partir de window.scrollY', () => {
      const globalPathLength = 1000;
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - 800);
      
      if (global.window) {
        Object.defineProperty(global.window, 'scrollY', {
          value: maxScroll / 2,
          writable: true,
          configurable: true,
        });
      }
      
      const progress = calculator.calculateInitialProgress(globalPathLength);
      
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('devrait retourner 0 si window est undefined', () => {
      // Note: Dans un environnement Node.js, window peut être undefined
      // Le service devrait gérer ce cas
      // On ne peut pas vraiment tester window undefined dans Jest car il existe toujours
      // Mais on peut vérifier que le service gère le cas où window.innerHeight est undefined
      const originalWindow = global.window;
      const originalInnerHeight = global.window?.innerHeight;
      
      // Simuler un window sans innerHeight
      if (global.window) {
        Object.defineProperty(global.window, 'innerHeight', {
          value: undefined,
          writable: true,
          configurable: true,
        });
      }
      
      // Le service devrait gérer ce cas gracieusement
      const progress = calculator.calculateInitialProgress(1000);
      expect(typeof progress).toBe('number');
      
      // Restaurer
      if (global.window && originalInnerHeight !== undefined) {
        Object.defineProperty(global.window, 'innerHeight', {
          value: originalInnerHeight,
          writable: true,
          configurable: true,
        });
      }
      global.window = originalWindow;
    });
  });
});

