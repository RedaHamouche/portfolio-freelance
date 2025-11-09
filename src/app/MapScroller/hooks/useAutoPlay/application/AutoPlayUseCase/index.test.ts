import { AutoPlayUseCase } from './index';
import { AutoPlayProgressService } from '../../domain/AutoPlayProgressService';
import { AutoPlayPauseService } from '../../domain/AutoPlayPauseService';
import { AutoPlayAnchorDetector } from '../../domain/AutoPlayAnchorDetector';
import { AutoPlayEasingService } from '../../domain/AutoPlayEasingService';
import { SCROLL_CONFIG } from '@/config';
import type { PathComponent } from '@/templating/domains/path/types';
import type { PathDomainAPI } from '@/templating/domains/path/api';

describe('AutoPlayUseCase', () => {
  let useCase: AutoPlayUseCase;
  let progressService: AutoPlayProgressService;
  let pauseService: AutoPlayPauseService;
  let anchorDetector: AutoPlayAnchorDetector;
  let mockPathDomain: {
    getNextAnchor: jest.Mock;
    getAllComponents: jest.Mock;
    getComponentById: jest.Mock;
    getComponentByAnchorId: jest.Mock;
    getActiveComponents: jest.Mock;
    findNextComponentInDirection: jest.Mock;
    calculateComponentPosition: jest.Mock;
  };

  beforeEach(() => {
    progressService = new AutoPlayProgressService();
    pauseService = new AutoPlayPauseService();
    mockPathDomain = {
      getNextAnchor: jest.fn(),
      getAllComponents: jest.fn(() => []),
      getComponentById: jest.fn(),
      getComponentByAnchorId: jest.fn(),
      getActiveComponents: jest.fn(() => []),
      findNextComponentInDirection: jest.fn(),
      calculateComponentPosition: jest.fn(),
    };
    anchorDetector = new AutoPlayAnchorDetector(mockPathDomain as PathDomainAPI);
    const easingService = new AutoPlayEasingService(mockPathDomain as PathDomainAPI);
    useCase = new AutoPlayUseCase(progressService, pauseService, anchorDetector, easingService);
  });

  describe('animate', () => {
    it('devrait retourner null si isAutoPlaying est false', () => {
      const result = useCase.animate({
        isAutoPlaying: false,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
      });

      expect(result).toBeNull();
    });

    it('devrait retourner null si isPaused est true', () => {
      const result = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: true,
      });

      expect(result).toBeNull();
    });

    it('devrait calculer le nouveau progress et retourner le résultat', () => {
      mockPathDomain.getNextAnchor.mockReturnValue(null);

      const result = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
      });

      expect(result).not.toBeNull();
      expect(result?.newProgress).toBeGreaterThan(0.5);
      expect(result?.newProgress).toBeLessThanOrEqual(1);
      expect(result?.shouldPause).toBe(false);
      expect(result?.pauseDuration).toBeUndefined();
    });

    it('devrait détecter un anchor et retourner shouldPause=true si autoScrollPauseTime > 0', () => {
      const mockAnchor: PathComponent = {
        id: 'test-anchor',
        type: 'TestComponent',
        displayName: 'Test Anchor',
        anchorId: 'testAnchor',
        position: { progress: 0.55 },
        autoScrollPauseTime: 2000,
      };
      mockPathDomain.getNextAnchor.mockReturnValue(mockAnchor);

      const result = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
      });

      expect(result).not.toBeNull();
      expect(result?.shouldPause).toBe(true);
      expect(result?.pauseDuration).toBe(2000);
      expect(result?.anchorId).toBe('testAnchor');
    });

    it('ne devrait pas faire de pause si autoScrollPauseTime est 0', () => {
      const mockAnchor: PathComponent = {
        id: 'test-anchor',
        type: 'TestComponent',
        displayName: 'Test Anchor',
        anchorId: 'testAnchor',
        position: { progress: 0.55 },
        autoScrollPauseTime: 0,
      };
      mockPathDomain.getNextAnchor.mockReturnValue(mockAnchor);

      const result = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
      });

      expect(result).not.toBeNull();
      expect(result?.shouldPause).toBe(false);
    });

    it('devrait utiliser 1s par défaut si autoScrollPauseTime n\'est pas défini', () => {
      const mockAnchor: PathComponent = {
        id: 'test-anchor',
        type: 'TestComponent',
        displayName: 'Test Anchor',
        anchorId: 'testAnchor',
        position: { progress: 0.55 },
        // autoScrollPauseTime non défini
      };
      mockPathDomain.getNextAnchor.mockReturnValue(mockAnchor);

      const result = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
      });

      expect(result).not.toBeNull();
      // Si autoScrollPauseTime n'est pas défini, shouldPause devrait être true
      // et pauseDuration devrait être 1000ms (1s par défaut)
      expect(result?.shouldPause).toBe(true);
      expect(result?.pauseDuration).toBe(1000);
    });

    it('devrait gérer la direction backward (-1)', () => {
      mockPathDomain.getNextAnchor.mockReturnValue(null);

      const result = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: -1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
      });

      expect(result).not.toBeNull();
      expect(result?.newProgress).toBeLessThan(0.5);
    });

    it('ne devrait pas faire de pause si l\'anchor est le même que le dernier', () => {
      const mockAnchor: PathComponent = {
        id: 'test-anchor',
        type: 'TestComponent',
        displayName: 'Test Anchor',
        anchorId: 'testAnchor',
        position: { progress: 0.55 },
        autoScrollPauseTime: 2000,
      };
      mockPathDomain.getNextAnchor.mockReturnValue(mockAnchor);

      // Première détection
      const result1 = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.5,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
        lastPausedAnchorId: null,
      });

      expect(result1?.shouldPause).toBe(true);

      // Deuxième détection avec le même anchor
      const result2 = useCase.animate({
        isAutoPlaying: true,
        currentProgress: 0.52,
        direction: 1,
        dt: SCROLL_CONFIG.FRAME_DELAY / 1000,
        isDesktop: true,
        isPaused: false,
        lastPausedAnchorId: 'testAnchor',
      });

      expect(result2?.shouldPause).toBe(false);
    });
  });

  describe('calculateBumpProgress', () => {
    it('devrait calculer le bump progress pour sortir de la zone d\'anchor', () => {
      const result = useCase.calculateBumpProgress(0.5, 1);
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('devrait gérer le wraparound pour le bump progress', () => {
      const result = useCase.calculateBumpProgress(0.99, 1);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    });

    it('devrait calculer le bump progress en backward', () => {
      const result = useCase.calculateBumpProgress(0.5, -1);
      expect(result).toBeLessThan(0.5);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

