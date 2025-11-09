import { handlePauseOnAnchor } from './index';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';
import { createResumeAfterPauseCallback } from '../createResumeAfterPauseCallback';

// Mock createResumeAfterPauseCallback
jest.mock('../createResumeAfterPauseCallback', () => ({
  createResumeAfterPauseCallback: jest.fn(),
}));

describe('handlePauseOnAnchor', () => {
  let lastPausedTimeRef: React.MutableRefObject<Map<string, number>>;
  let isPausedRef: React.MutableRefObject<boolean>;
  let lastPausedAnchorIdRef: React.MutableRefObject<string | null>;
  let timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  let timeoutIdRef: React.MutableRefObject<number>;
  let isModalOpenRef: React.MutableRefObject<boolean>;
  let isAutoPlayingRef: React.MutableRefObject<boolean>;
  let animateRef: React.MutableRefObject<FrameRequestCallback | null>;
  let mockStart: jest.Mock;
  let mockDispatch: jest.Mock;
  let mockPerformanceNow: jest.SpyInstance;
  let setTimeoutSpy: jest.SpyInstance;
  let clearTimeoutSpy: jest.SpyInstance;
  let mockResumeCallback: jest.Mock;

  beforeEach(() => {
    lastPausedTimeRef = { current: new Map() };
    isPausedRef = { current: false };
    lastPausedAnchorIdRef = { current: null };
    timeoutRef = { current: null };
    timeoutIdRef = { current: 0 };
    isModalOpenRef = { current: false };
    isAutoPlayingRef = { current: true };
    animateRef = { current: jest.fn() };
    mockStart = jest.fn();
    mockDispatch = jest.fn();
    mockResumeCallback = jest.fn();
    mockPerformanceNow = jest.spyOn(performance, 'now').mockReturnValue(1000);
    setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockReturnValue(123 as unknown as NodeJS.Timeout);
    clearTimeoutSpy = jest.spyOn(global, 'clearTimeout').mockImplementation(() => {});

    (createResumeAfterPauseCallback as jest.Mock).mockReturnValue(mockResumeCallback);
  });

  afterEach(() => {
    mockPerformanceNow.mockRestore();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('devrait mettre isPausedRef à true', () => {
    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(isPausedRef.current).toBe(true);
  });

  it('devrait enregistrer l\'anchorId dans lastPausedAnchorIdRef', () => {
    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(lastPausedAnchorIdRef.current).toBe('anchor1');
  });

  it('devrait enregistrer le temps de pause dans lastPausedTimeRef', () => {
    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(lastPausedTimeRef.current.get('anchor1')).toBe(1000);
  });

  it('devrait dispatcher setAutoScrollTemporarilyPaused(true)', () => {
    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(true));
  });

  it('devrait nettoyer le timeout existant s\'il y en a un', () => {
    const existingTimeout = setTimeout(() => {}, 1000);
    timeoutRef.current = existingTimeout;

    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimeout);
  });

  it('ne devrait pas appeler clearTimeout si timeoutRef.current est null', () => {
    timeoutRef.current = null;

    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });

  it('devrait incrémenter timeoutIdRef', () => {
    timeoutIdRef.current = 5;

    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(timeoutIdRef.current).toBe(6);
  });

  it('devrait créer le callback de reprise avec les bons paramètres', () => {
    timeoutIdRef.current = 5;

    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(createResumeAfterPauseCallback).toHaveBeenCalledWith(
      6, // currentTimeoutId (timeoutIdRef.current après incrément)
      'anchor1', // currentAnchorId
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      lastPausedAnchorIdRef,
      isPausedRef,
      animateRef,
      mockStart,
      mockDispatch
    );
  });

  it('devrait créer un setTimeout avec la bonne durée', () => {
    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(setTimeoutSpy).toHaveBeenCalledWith(mockResumeCallback, 2000);
  });

  it('devrait stocker le timeout dans timeoutRef', () => {
    handlePauseOnAnchor(
      'anchor1',
      2000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(timeoutRef.current).toBe(123);
  });

  it('devrait effectuer toutes les actions dans le bon ordre', () => {
    const existingTimeout = setTimeout(() => {}, 1000);
    timeoutRef.current = existingTimeout;
    timeoutIdRef.current = 10;

    handlePauseOnAnchor(
      'anchor2',
      3000,
      lastPausedTimeRef,
      isPausedRef,
      lastPausedAnchorIdRef,
      timeoutRef,
      timeoutIdRef,
      isModalOpenRef,
      isAutoPlayingRef,
      animateRef,
      mockStart,
      mockDispatch
    );

    expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimeout);
    expect(isPausedRef.current).toBe(true);
    expect(lastPausedAnchorIdRef.current).toBe('anchor2');
    expect(lastPausedTimeRef.current.get('anchor2')).toBe(1000);
    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(true));
    expect(timeoutIdRef.current).toBe(11);
    expect(createResumeAfterPauseCallback).toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledWith(mockResumeCallback, 3000);
    expect(timeoutRef.current).toBe(123);
  });
});

