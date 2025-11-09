import { handleScroll } from './index';
import { isBrowser } from '@/utils/ssr/isBrowser';
import { isValidPathLength } from '@/utils/validation/isValidPathLength';
import { ManualScrollSyncUseCase } from '@/components/app/MapScroller/hooks/useManualScrollSync/application/ManualScrollSyncUseCase';

// Mock dependencies
jest.mock('@/utils/ssr/isBrowser');
jest.mock('@/utils/validation/isValidPathLength');

describe('handleScroll', () => {
  let refs: {
    pendingUpdateRef: React.MutableRefObject<boolean>;
    rafIdRef: React.MutableRefObject<number | null>;
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
    refs = {
      pendingUpdateRef: { current: false },
      rafIdRef: { current: null },
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

    (isBrowser as jest.Mock).mockReturnValue(true);
    (isValidPathLength as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    rafCallback = null;
  });

  it('ne devrait rien faire si pas dans le navigateur', () => {
    (isBrowser as jest.Mock).mockReturnValue(false);

    handleScroll(refs, callbacks, 1000, false);

    expect(callbacks.handleInitializationAndVelocity).not.toHaveBeenCalled();
    expect(callbacks.processScrollUpdate).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si la modal est ouverte', () => {
    handleScroll(refs, callbacks, 1000, true);

    expect(callbacks.handleInitializationAndVelocity).not.toHaveBeenCalled();
    expect(callbacks.processScrollUpdate).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si globalPathLength est invalide', () => {
    (isValidPathLength as jest.Mock).mockReturnValue(false);

    handleScroll(refs, callbacks, 0, false);

    expect(callbacks.handleInitializationAndVelocity).not.toHaveBeenCalled();
    expect(callbacks.processScrollUpdate).not.toHaveBeenCalled();
  });

  it('devrait appeler handleInitializationAndVelocity', () => {
    handleScroll(refs, callbacks, 1000, false);

    expect(callbacks.handleInitializationAndVelocity).toHaveBeenCalledTimes(1);
  });

  it('devrait programmer processScrollUpdate via RAF si pendingUpdateRef est false', () => {
    refs.pendingUpdateRef.current = false;
    refs.rafIdRef.current = null;

    handleScroll(refs, callbacks, 1000, false);

    expect(refs.pendingUpdateRef.current).toBe(true);
    expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(refs.rafIdRef.current).toBe(rafId);
  });

  it('ne devrait pas programmer un nouveau RAF si pendingUpdateRef est déjà true', () => {
    refs.pendingUpdateRef.current = true;

    handleScroll(refs, callbacks, 1000, false);

    expect(global.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('ne devrait pas programmer un nouveau RAF si rafIdRef.current n\'est pas null', () => {
    refs.pendingUpdateRef.current = false;
    refs.rafIdRef.current = 456;

    handleScroll(refs, callbacks, 1000, false);

    expect(global.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('devrait appeler processScrollUpdate dans le callback RAF', () => {
    refs.pendingUpdateRef.current = false;
    refs.rafIdRef.current = null;

    handleScroll(refs, callbacks, 1000, false);

    expect(rafCallback).not.toBeNull();
    if (rafCallback) {
      rafCallback(performance.now());
      expect(callbacks.processScrollUpdate).toHaveBeenCalledTimes(1);
    }
  });

  it('devrait appeler onScrollState(true) si fourni', () => {
    handleScroll(refs, callbacks, 1000, false);

    expect(callbacks.onScrollState).toHaveBeenCalledWith(true);
  });

  it('ne devrait pas appeler onScrollState si non fourni', () => {
    const callbacksWithoutOnScrollState = {
      ...callbacks,
      onScrollState: undefined,
    };

    handleScroll(refs, callbacksWithoutOnScrollState, 1000, false);

    // Pas d'erreur, juste pas d'appel
    expect(callbacks.handleInitializationAndVelocity).toHaveBeenCalled();
  });

  it('devrait appeler updateLastScrollTime sur le useCase', () => {
    handleScroll(refs, callbacks, 1000, false);

    expect(callbacks.getUseCase).toHaveBeenCalled();
    expect(mockUseCase.updateLastScrollTime).toHaveBeenCalledTimes(1);
  });

  it('devrait appeler scheduleScrollEndCheck', () => {
    handleScroll(refs, callbacks, 1000, false);

    expect(callbacks.scheduleScrollEndCheck).toHaveBeenCalledTimes(1);
  });
});

