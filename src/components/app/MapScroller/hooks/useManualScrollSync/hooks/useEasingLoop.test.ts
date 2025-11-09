import { renderHook } from '@testing-library/react';
import { useEasingLoop, type UseEasingLoopRefs } from './useEasingLoop';
import type { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import type { ScrollContextType } from '@/contexts/ScrollContext';
import type { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';
import { updateScrollDirection } from '../actions/updateScrollDirection';
import { isBrowser } from '@/utils/ssr/isBrowser';

jest.mock('@/utils/ssr/isBrowser');
jest.mock('../actions/updateScrollDirection');

describe('useEasingLoop', () => {
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;
  let mockScrollContext: ScrollContextType;
  let mockProgressUpdateService: jest.Mocked<ProgressUpdateService>;
  let refs: UseEasingLoopRefs;
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    rafCallbacks = [];
    rafId = 1;

    mockUseCase = {
      animateEasing: jest.fn().mockReturnValue(true),
      getCurrentProgress: jest.fn().mockReturnValue(0.5),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    mockScrollContext = {} as ScrollContextType;

    mockProgressUpdateService = {
      updateProgressOnly: jest.fn(),
    } as unknown as jest.Mocked<ProgressUpdateService>;

    refs = {
      easingRafIdRef: { current: null },
      isEasingActiveRef: { current: false },
      isAutoPlayingRef: { current: false },
      lastScrollDirectionRef: { current: null },
    };

    global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafId++;
    });

    (isBrowser as jest.Mock).mockReturnValue(true);
  });

  describe('easingLoop', () => {
    it('ne devrait rien faire si pas dans le navigateur', () => {
      (isBrowser as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.easingLoop();

      expect(mockUseCase.animateEasing).not.toHaveBeenCalled();
      expect(mockProgressUpdateService.updateProgressOnly).not.toHaveBeenCalled();
    });

    it('devrait arrêter la boucle si la modal est ouverte', () => {
      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, true, () => mockUseCase)
      );

      result.current.easingLoop();

      expect(refs.isEasingActiveRef.current).toBe(false);
      expect(refs.easingRafIdRef.current).toBe(null);
      expect(mockUseCase.animateEasing).not.toHaveBeenCalled();
    });

    it('devrait appeler animateEasing et mettre à jour le progress', () => {
      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.easingLoop();

      expect(mockUseCase.animateEasing).toHaveBeenCalled();
      expect(mockUseCase.getCurrentProgress).toHaveBeenCalled();
      expect(mockProgressUpdateService.updateProgressOnly).toHaveBeenCalledWith(0.5);
    });

    it('devrait appeler updateScrollDirection', () => {
      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.easingLoop();

      expect(updateScrollDirection).toHaveBeenCalledWith(
        mockUseCase,
        mockProgressUpdateService,
        refs.isAutoPlayingRef,
        refs.lastScrollDirectionRef
      );
    });

    it('devrait continuer la boucle si shouldContinue est true', () => {
      mockUseCase.animateEasing.mockReturnValue(true);

      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.easingLoop();

      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(refs.isEasingActiveRef.current).toBe(false); // Pas changé car pas démarré via startEasingLoop
    });

    it('devrait arrêter la boucle si shouldContinue est false', () => {
      mockUseCase.animateEasing.mockReturnValue(false);

      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.easingLoop();

      expect(refs.isEasingActiveRef.current).toBe(false);
      expect(refs.easingRafIdRef.current).toBe(null);
    });
  });

  describe('startEasingLoop', () => {
    it('ne devrait pas démarrer si déjà actif', () => {
      refs.isEasingActiveRef.current = true;

      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      const initialRafCalls = (global.requestAnimationFrame as jest.Mock).mock.calls.length;

      result.current.startEasingLoop();

      expect((global.requestAnimationFrame as jest.Mock).mock.calls.length).toBe(initialRafCalls);
    });

    it('devrait démarrer la boucle si pas actif', () => {
      refs.isEasingActiveRef.current = false;

      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.startEasingLoop();

      expect(refs.isEasingActiveRef.current).toBe(true);
      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(refs.easingRafIdRef.current).not.toBe(null);
    });

    it('devrait exécuter la boucle d\'easing après le démarrage', () => {
      const { result } = renderHook(() =>
        useEasingLoop(mockScrollContext, refs, mockProgressUpdateService, false, () => mockUseCase)
      );

      result.current.startEasingLoop();

      // Exécuter le callback RAF
      if (rafCallbacks.length > 0) {
        rafCallbacks[0](performance.now());
      }

      expect(mockUseCase.animateEasing).toHaveBeenCalled();
    });
  });
});

