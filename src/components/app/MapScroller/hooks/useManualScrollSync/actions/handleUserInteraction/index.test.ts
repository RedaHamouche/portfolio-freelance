import { handleUserInteraction } from './index';
import { setAutoPlaying } from '@/store/scrollSlice';
import { isBrowser } from '@/utils/ssr/isBrowser';
import { isValidPathLength } from '@/utils/validation/isValidPathLength';
import { isInteractiveElement } from '@/components/app/MapScroller/hooks/useManualScrollSync/utils/isInteractiveElement';
import { ManualScrollSyncUseCase } from '@/components/app/MapScroller/hooks/useManualScrollSync/application/ManualScrollSyncUseCase';

// Mock dependencies
jest.mock('@/utils/ssr/isBrowser');
jest.mock('@/utils/validation/isValidPathLength');
jest.mock('@/components/app/MapScroller/hooks/useManualScrollSync/utils/isInteractiveElement');

describe('handleUserInteraction', () => {
  let dispatch: jest.Mock;
  let refs: {
    isAutoPlayingRef: React.MutableRefObject<boolean>;
    pendingUpdateRef: React.MutableRefObject<boolean>;
    rafIdRef: React.MutableRefObject<number | null>;
    scrollYRef: React.MutableRefObject<number>;
  };
  let callbacks: {
    handleInitializationAndVelocity: jest.Mock;
    processScrollUpdate: jest.Mock;
    scheduleScrollEndCheck: jest.Mock;
    getUseCase: jest.Mock;
    onScrollState?: jest.Mock;
  };
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;
  let rafCallback: FrameRequestCallback | null = null;
  let rafId: number;

  beforeEach(() => {
    dispatch = jest.fn();
    refs = {
      isAutoPlayingRef: { current: false },
      pendingUpdateRef: { current: false },
      rafIdRef: { current: null },
      scrollYRef: { current: 0 },
    };

    mockUseCase = {
      updateLastScrollTime: jest.fn(),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    callbacks = {
      handleInitializationAndVelocity: jest.fn(),
      processScrollUpdate: jest.fn(),
      scheduleScrollEndCheck: jest.fn(),
      getUseCase: jest.fn(() => mockUseCase),
      onScrollState: jest.fn(),
    };

    rafId = 123;
    global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      rafCallback = cb;
      return rafId;
    });

    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 500,
    });

    (isBrowser as jest.Mock).mockReturnValue(true);
    (isValidPathLength as jest.Mock).mockReturnValue(true);
    (isInteractiveElement as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    rafCallback = null;
  });

  it('ne devrait rien faire si pas dans le navigateur', () => {
    (isBrowser as jest.Mock).mockReturnValue(false);

    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(callbacks.handleInitializationAndVelocity).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si la modal est ouverte', () => {
    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, true);

    expect(callbacks.handleInitializationAndVelocity).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si globalPathLength est invalide', () => {
    (isValidPathLength as jest.Mock).mockReturnValue(false);

    handleUserInteraction(undefined, dispatch, refs, callbacks, 0, false);

    expect(callbacks.handleInitializationAndVelocity).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('devrait appeler handleInitializationAndVelocity avec l\'événement', () => {
    const mockEvent = new Event('wheel');

    handleUserInteraction(mockEvent, dispatch, refs, callbacks, 1000, false);

    expect(callbacks.handleInitializationAndVelocity).toHaveBeenCalledWith(mockEvent);
  });

  it('devrait ignorer les touches sur éléments interactifs', () => {
    const touchEvent = new TouchEvent('touchstart', { bubbles: true });
    const mockTarget = document.createElement('button');
    Object.defineProperty(touchEvent, 'target', {
      value: mockTarget,
      writable: false,
    });
    (isInteractiveElement as jest.Mock).mockReturnValue(true);

    handleUserInteraction(touchEvent, dispatch, refs, callbacks, 1000, false);

    expect(dispatch).not.toHaveBeenCalled();
    expect(callbacks.processScrollUpdate).not.toHaveBeenCalled();
  });

  it('devrait mettre en pause l\'autoplay si actif', () => {
    refs.isAutoPlayingRef.current = true;

    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(refs.isAutoPlayingRef.current).toBe(false);
    expect(dispatch).toHaveBeenCalledWith(setAutoPlaying(false));
  });

  it('ne devrait pas mettre en pause l\'autoplay si inactif', () => {
    refs.isAutoPlayingRef.current = false;

    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(dispatch).not.toHaveBeenCalledWith(setAutoPlaying(false));
  });

  it('devrait appeler onScrollState(true) si fourni', () => {
    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(callbacks.onScrollState).toHaveBeenCalledWith(true);
  });

  it('devrait appeler updateLastScrollTime sur le useCase', () => {
    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(callbacks.getUseCase).toHaveBeenCalled();
    expect(mockUseCase.updateLastScrollTime).toHaveBeenCalledTimes(1);
  });

  it('devrait appeler scheduleScrollEndCheck', () => {
    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(callbacks.scheduleScrollEndCheck).toHaveBeenCalledTimes(1);
  });

  it('devrait programmer processScrollUpdate via RAF si pendingUpdateRef est false', () => {
    refs.pendingUpdateRef.current = false;
    refs.rafIdRef.current = null;

    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(refs.pendingUpdateRef.current).toBe(true);
    expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(refs.rafIdRef.current).toBe(rafId);
  });

  it('devrait mettre à jour scrollYRef dans le callback RAF', () => {
    refs.pendingUpdateRef.current = false;
    refs.rafIdRef.current = null;
    window.scrollY = 750;

    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(rafCallback).not.toBeNull();
    if (rafCallback) {
      rafCallback(performance.now());
      expect(refs.scrollYRef.current).toBe(750);
      expect(callbacks.processScrollUpdate).toHaveBeenCalledTimes(1);
    }
  });

  it('ne devrait pas programmer un nouveau RAF si pendingUpdateRef est déjà true', () => {
    refs.pendingUpdateRef.current = true;

    handleUserInteraction(undefined, dispatch, refs, callbacks, 1000, false);

    expect(global.requestAnimationFrame).not.toHaveBeenCalled();
  });
});

