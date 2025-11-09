import { renderHook } from '@testing-library/react';
import { useScrollInitialization, type UseScrollInitializationRefs } from './useScrollInitialization';
import { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import type { ScrollContextType } from '@/contexts/ScrollContext';

describe('useScrollInitialization', () => {
  let mockScrollContext: ScrollContextType;
  let refs: UseScrollInitializationRefs;
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockScrollContext = {
      easingService: {} as ScrollContextType['easingService'],
      progressCalculator: {} as ScrollContextType['progressCalculator'],
      stateDetector: {} as ScrollContextType['stateDetector'],
      velocityService: {
        reset: jest.fn(),
      } as unknown as ScrollContextType['velocityService'],
      velocityConfig: {
        enabled: false,
        friction: 0.95,
        maxVelocity: 10,
        velocityToInertiaMultiplier: 0.1,
        baseInertiaFactor: 0.12,
      },
    } as ScrollContextType;

    refs = {
      isInitializedRef: { current: false },
      lastInitializedPathLengthRef: { current: 0 },
    };

    mockUseCase = {
      initialize: jest.fn(),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('initializeUseCase', () => {
    it('devrait initialiser le useCase avec succès', () => {
      const getUseCase = jest.fn(() => mockUseCase);

      const { result } = renderHook(() =>
        useScrollInitialization(mockScrollContext, refs, getUseCase)
      );

      result.current.initializeUseCase(1000, 0.5);

      expect(mockUseCase.initialize).toHaveBeenCalledWith(1000, 0.5);
      expect(refs.lastInitializedPathLengthRef.current).toBe(1000);
      expect(refs.isInitializedRef.current).toBe(true);
    });

    it('devrait initialiser sans progress si non fourni', () => {
      const getUseCase = jest.fn(() => mockUseCase);

      const { result } = renderHook(() =>
        useScrollInitialization(mockScrollContext, refs, getUseCase)
      );

      result.current.initializeUseCase(1000);

      expect(mockUseCase.initialize).toHaveBeenCalledWith(1000, undefined);
      expect(refs.lastInitializedPathLengthRef.current).toBe(1000);
      expect(refs.isInitializedRef.current).toBe(true);
    });

    it('devrait gérer les erreurs et recréer le useCase', () => {
      // Créer un mock qui lance une erreur au premier appel, puis réussit
      let callCount = 0;
      const getUseCase = jest.fn(() => {
        if (callCount === 0) {
          callCount++;
          const failingUseCase = {
            initialize: jest.fn(() => {
              throw new Error('Initialization failed');
            }),
          };
          return failingUseCase as unknown as ManualScrollSyncUseCase;
        }
        return mockUseCase;
      });

      const { result } = renderHook(() =>
        useScrollInitialization(mockScrollContext, refs, getUseCase)
      );

      result.current.initializeUseCase(1000, 0.5);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useManualScrollSync] Erreur lors de l\'initialisation:',
        expect.any(Error)
      );
      expect(refs.lastInitializedPathLengthRef.current).toBe(1000);
      expect(refs.isInitializedRef.current).toBe(true);
    });

    it('devrait mettre à jour lastInitializedPathLengthRef à chaque initialisation', () => {
      const getUseCase = jest.fn(() => mockUseCase);

      const { result } = renderHook(() =>
        useScrollInitialization(mockScrollContext, refs, getUseCase)
      );

      result.current.initializeUseCase(1000);
      expect(refs.lastInitializedPathLengthRef.current).toBe(1000);

      result.current.initializeUseCase(2000);
      expect(refs.lastInitializedPathLengthRef.current).toBe(2000);
    });
  });
});

