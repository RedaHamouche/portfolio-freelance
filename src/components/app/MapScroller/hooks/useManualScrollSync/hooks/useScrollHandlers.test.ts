import { renderHook } from '@testing-library/react';
import { useScrollHandlers, type ScrollHandlersRefs } from './useScrollHandlers';
import type { ScrollContextType } from '@/contexts/ScrollContext';
import type { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';
import type { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import { processScrollUpdate } from '../actions/processScrollUpdate';
import { handleUserInteraction, type HandleUserInteractionCallbacks } from '../actions/handleUserInteraction';
import { handleScroll } from '../actions/handleScroll';

jest.mock('../actions/processScrollUpdate');
jest.mock('../actions/handleUserInteraction');
jest.mock('../actions/handleScroll');
jest.mock('./useScrollEndCheck');

describe('useScrollHandlers', () => {
  let mockScrollContext: ScrollContextType;
  let mockProgressUpdateService: jest.Mocked<ProgressUpdateService>;
  let mockDispatch: jest.Mock;
  let refs: ScrollHandlersRefs;
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;
  let callbacks: {
    initializeUseCase: jest.Mock;
    getUseCase: jest.Mock;
    startEasingLoop: jest.Mock;
    updateScrollDirectionCallback: jest.Mock;
    onScrollState?: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockScrollContext = {
      velocityConfig: {
        enabled: true,
        friction: 0.95,
        maxVelocity: 10,
        velocityToInertiaMultiplier: 0.1,
        baseInertiaFactor: 0.12,
      },
    } as ScrollContextType;

    mockProgressUpdateService = {} as jest.Mocked<ProgressUpdateService>;
    mockDispatch = jest.fn();

    refs = {
      isInitializedRef: { current: false },
      lastInitializedPathLengthRef: { current: 0 },
      scrollYRef: { current: 0 },
      pendingUpdateRef: { current: false },
      rafIdRef: { current: null },
      scrollEndTimeoutRef: { current: null },
    };

    mockUseCase = {
      updateVelocityFromWheel: jest.fn(),
      updateVelocity: jest.fn(),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    callbacks = {
      initializeUseCase: jest.fn(),
      getUseCase: jest.fn(() => mockUseCase),
      startEasingLoop: jest.fn(),
      updateScrollDirectionCallback: jest.fn(),
      onScrollState: jest.fn(),
    };

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 100,
    });
  });

  describe('scheduleScrollEndCheckCallback', () => {
    it('devrait appeler scheduleScrollEndCheck avec les bons paramètres', () => {
      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      // scheduleScrollEndCheckCallback est utilisé dans handleUserInteraction et handleScroll
      // Testons via handleUserInteraction
      const event = new Event('wheel');
      result.current.handleUserInteraction(event);

      // Vérifions que handleUserInteraction a été appelé avec les callbacks contenant scheduleScrollEndCheck
      expect(handleUserInteraction).toHaveBeenCalled();
      const callArgs = handleUserInteraction.mock.calls[0];
      const callbacksArg = callArgs[3] as HandleUserInteractionCallbacks;
      expect(callbacksArg.scheduleScrollEndCheck).toBeDefined();
      expect(typeof callbacksArg.scheduleScrollEndCheck).toBe('function');
    });
  });

  describe('handleInitializationAndVelocity', () => {
    it('devrait créer handleInitializationAndVelocity callback', () => {
      refs.isInitializedRef.current = false;
      refs.lastInitializedPathLengthRef.current = 0;

      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      // Vérifions que handleUserInteraction est bien créé et appelle handleUserInteraction action
      const event = new Event('wheel');
      result.current.handleUserInteraction(event);

      expect(handleUserInteraction).toHaveBeenCalledWith(
        event,
        mockDispatch,
        refs,
        expect.objectContaining({
          handleInitializationAndVelocity: expect.any(Function),
        }),
        1000,
        false
      );
    });

    it('devrait créer les callbacks correctement', () => {
      refs.isInitializedRef.current = true;
      refs.lastInitializedPathLengthRef.current = 500;

      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      const event = new Event('wheel');
      result.current.handleUserInteraction(event);

      expect(handleUserInteraction).toHaveBeenCalled();
    });

    it('ne devrait pas réinitialiser si déjà initialisé avec le même pathLength', () => {
      refs.isInitializedRef.current = true;
      refs.lastInitializedPathLengthRef.current = 1000;

      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      const event = new Event('wheel');
      result.current.handleUserInteraction(event);

      expect(callbacks.initializeUseCase).not.toHaveBeenCalled();
    });

    it('devrait passer les bons paramètres pour les événements wheel', () => {
      mockScrollContext.velocityConfig.enabled = true;
      refs.isInitializedRef.current = true;
      refs.lastInitializedPathLengthRef.current = 1000;

      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      const wheelEvent = new WheelEvent('wheel', { deltaY: 10 });
      result.current.handleUserInteraction(wheelEvent);

      expect(handleUserInteraction).toHaveBeenCalledWith(
        wheelEvent,
        mockDispatch,
        refs,
        expect.any(Object),
        1000,
        false
      );
    });

    it('ne devrait pas mettre à jour la vélocité si disabled', () => {
      mockScrollContext.velocityConfig.enabled = false;

      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      const wheelEvent = new WheelEvent('wheel', { deltaY: 10 });
      result.current.handleUserInteraction(wheelEvent);

      expect(mockUseCase.updateVelocityFromWheel).not.toHaveBeenCalled();
    });
  });

  describe('handleUserInteraction', () => {
    it('devrait appeler handleUserInteraction action avec les bons paramètres', () => {
      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      const event = new Event('wheel');
      result.current.handleUserInteraction(event);

      expect(handleUserInteraction).toHaveBeenCalledWith(
        event,
        mockDispatch,
        refs,
        expect.any(Object),
        1000,
        false
      );
    });

    it('devrait passer isModalOpen correctement', () => {
      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          true
        )
      );

      const event = new Event('wheel');
      result.current.handleUserInteraction(event);

      expect(handleUserInteraction).toHaveBeenCalledWith(
        expect.any(Event),
        expect.any(Function),
        expect.any(Object),
        expect.any(Object),
        1000,
        true
      );
    });
  });

  describe('handleScroll', () => {
    it('devrait appeler handleScroll action avec les bons paramètres', () => {
      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      result.current.handleScroll();

      expect(handleScroll).toHaveBeenCalledWith(refs, expect.any(Object), 1000, false);
    });
  });

  describe('processScrollUpdate', () => {
    it('devrait appeler processScrollUpdate action avec les bons paramètres', () => {
      const { result } = renderHook(() =>
        useScrollHandlers(
          mockScrollContext,
          mockProgressUpdateService,
          mockDispatch,
          refs,
          callbacks,
          1000,
          false
        )
      );

      result.current.processScrollUpdate();

      expect(processScrollUpdate).toHaveBeenCalledWith(
        mockScrollContext,
        mockProgressUpdateService,
        refs,
        expect.any(Object),
        1000,
        false
      );
    });
  });

  describe('Mémoïsation des callbacks', () => {
    it('devrait mémoïser processScrollUpdateCallbacks', () => {
      const { result, rerender } = renderHook(
        ({ callbacks }) =>
          useScrollHandlers(
            mockScrollContext,
            mockProgressUpdateService,
            mockDispatch,
            refs,
            callbacks,
            1000,
            false
          ),
        { initialProps: { callbacks } }
      );

      const firstCallbacks = result.current.processScrollUpdate;

      rerender({ callbacks });

      const secondCallbacks = result.current.processScrollUpdate;

      // Les callbacks devraient être les mêmes si les dépendances n'ont pas changé
      expect(firstCallbacks).toBe(secondCallbacks);
    });
  });
});

