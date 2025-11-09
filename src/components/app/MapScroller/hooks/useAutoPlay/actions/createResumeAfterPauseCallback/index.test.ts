import { createResumeAfterPauseCallback } from './index';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';

describe('createResumeAfterPauseCallback', () => {
  let timeoutIdRef: React.MutableRefObject<number>;
  let isModalOpenRef: React.MutableRefObject<boolean>;
  let isAutoPlayingRef: React.MutableRefObject<boolean>;
  let lastPausedAnchorIdRef: React.MutableRefObject<string | null>;
  let isPausedRef: React.MutableRefObject<boolean>;
  let animateRef: React.MutableRefObject<FrameRequestCallback | null>;
  let mockStart: jest.Mock;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    timeoutIdRef = { current: 5 };
    isModalOpenRef = { current: false };
    isAutoPlayingRef = { current: true };
    lastPausedAnchorIdRef = { current: 'anchor1' };
    isPausedRef = { current: true };
    animateRef = { current: jest.fn() };
    mockStart = jest.fn();
    mockDispatch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait retourner une fonction', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(typeof callback).toBe('function');
  });

  it('ne devrait rien faire si timeoutIdRef a changé', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    timeoutIdRef.current = 6; // Timeout invalide
    callback();

    expect(isPausedRef.current).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si la modal est ouverte', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    isModalOpenRef.current = true;
    callback();

    expect(isPausedRef.current).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si l\'autoplay n\'est plus actif', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    isAutoPlayingRef.current = false;
    callback();

    expect(isPausedRef.current).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si l\'anchor a changé', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    lastPausedAnchorIdRef.current = 'anchor2'; // Anchor différent
    callback();

    expect(isPausedRef.current).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si isPausedRef est déjà false', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    isPausedRef.current = false; // Déjà repris
    callback();

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('devrait reprendre l\'animation si toutes les conditions sont remplies', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    callback();

    expect(isPausedRef.current).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(false));
    expect(mockStart).toHaveBeenCalledWith(animateRef.current);
  });

  it('ne devrait pas appeler start si animateRef.current est null', () => {
    animateRef.current = null;
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    callback();

    expect(isPausedRef.current).toBe(false);
    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(false));
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('devrait vérifier toutes les conditions dans le bon ordre', () => {
    const callback = createResumeAfterPauseCallback(
      5,
      'anchor1',
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    // Toutes les conditions sont remplies
    callback();

    expect(isPausedRef.current).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});

