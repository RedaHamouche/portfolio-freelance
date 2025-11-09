import { ManualScrollSyncUseCase } from './ManualScrollSyncUseCase';
import { ScrollEasingService, EasingFunctions } from './domain/ScrollEasingService';
import { ScrollProgressCalculator } from './domain/ScrollProgressCalculator';
import { ScrollStateDetector } from './domain/ScrollStateDetector';
import { ScrollVelocityService } from './domain/ScrollVelocityService';

describe('ManualScrollSyncUseCase', () => {
  let useCase: ManualScrollSyncUseCase;
  let easingService: ScrollEasingService;
  let progressCalculator: ScrollProgressCalculator;
  let stateDetector: ScrollStateDetector;
  let velocityService: ScrollVelocityService;
  const velocityConfig = {
    enabled: false,
    friction: 0.95,
    maxVelocity: 10,
    velocityToInertiaMultiplier: 0.1,
    baseInertiaFactor: 0.12,
  };

  beforeEach(() => {
    easingService = new ScrollEasingService(0.12, EasingFunctions.linear, 0.0001);
    progressCalculator = new ScrollProgressCalculator();
    stateDetector = new ScrollStateDetector(150);
    velocityService = new ScrollVelocityService(velocityConfig.friction, velocityConfig.maxVelocity);
    useCase = new ManualScrollSyncUseCase(
      easingService,
      progressCalculator,
      stateDetector,
      velocityService,
      velocityConfig
    );
  });

  describe('initialize', () => {
    it('devrait initialiser le state avec la position de scroll actuelle', () => {
      const globalPathLength = 1000;
      useCase.initialize(globalPathLength);
      
      const progress = useCase.getCurrentProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  describe('updateScrollPosition', () => {
    it('devrait mettre à jour le targetProgress', () => {
      const globalPathLength = 1000;
      const scrollY = 500;
      
      const result = useCase.updateScrollPosition(scrollY, globalPathLength);
      
      expect(result).toBeDefined();
    });

    it('devrait retourner shouldCorrect=true si correction nécessaire', () => {
      const globalPathLength = 1000;
      const scrollY = -10;
      
      const result = useCase.updateScrollPosition(scrollY, globalPathLength);
      
      expect(result.shouldCorrect).toBe(true);
      expect(result.correctionY).toBeDefined();
    });
  });

  describe('animateEasing', () => {
    beforeEach(() => {
      // Initialiser avec des valeurs différentes pour tester l'animation
      useCase = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig,
        {
          currentProgress: 0.2,
          targetProgress: 0.5,
        }
      );
    });

    it('devrait interpoler progressivement vers la cible', () => {
      const initialProgress = useCase.getCurrentProgress();
      const shouldContinue = useCase.animateEasing();
      
      expect(useCase.getCurrentProgress()).toBeGreaterThan(initialProgress);
      expect(shouldContinue).toBe(true);
    });

    it('devrait retourner false quand la cible est atteinte', () => {
      // Mettre la cible très proche de la position actuelle
      useCase = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig,
        {
          currentProgress: 0.5,
          targetProgress: 0.50005, // Très proche
        }
      );
      
      const shouldContinue = useCase.animateEasing();
      expect(shouldContinue).toBe(false);
    });
  });

  describe('checkScrollEnd', () => {
    it('devrait retourner false si le scroll vient de se produire', () => {
      useCase.updateLastScrollTime();
      expect(useCase.checkScrollEnd()).toBe(false);
    });

    it('devrait retourner true si le scroll est arrêté depuis longtemps', () => {
      useCase = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig,
        {
          lastScrollTime: performance.now() - 200, // 200ms dans le passé
        }
      );
      
      expect(useCase.checkScrollEnd()).toBe(true);
    });
  });

  describe('getScrollDirection', () => {
    it('devrait retourner null si pas de previous progress', () => {
      useCase = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig,
        {
          prevProgress: null,
        }
      );
      
      expect(useCase.getScrollDirection()).toBe(null);
    });

    it('devrait retourner forward si targetProgress augmente', () => {
      useCase = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig,
        {
          targetProgress: 0.6,
          prevProgress: 0.4,
        }
      );
      
      expect(useCase.getScrollDirection()).toBe('forward');
    });

    it('devrait retourner backward si targetProgress diminue', () => {
      useCase = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig,
        {
          targetProgress: 0.3,
          prevProgress: 0.5,
        }
      );
      
      expect(useCase.getScrollDirection()).toBe('backward');
    });
  });
});

