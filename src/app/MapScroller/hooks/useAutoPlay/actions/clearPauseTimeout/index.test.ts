import { clearPauseTimeout } from './index';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';

describe('clearPauseTimeout', () => {
  let timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  let timeoutIdRef: React.MutableRefObject<number>;
  let isPausedRef: React.MutableRefObject<boolean>;
  let lastPausedAnchorIdRef: React.MutableRefObject<string | null>;
  let mockDispatch: jest.Mock;
  let clearTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    timeoutRef = { current: null };
    timeoutIdRef = { current: 0 };
    isPausedRef = { current: false };
    lastPausedAnchorIdRef = { current: null };
    mockDispatch = jest.fn();
    clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    clearTimeoutSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('devrait nettoyer le timeout s\'il existe', () => {
    const mockTimeout = setTimeout(() => {}, 1000);
    timeoutRef.current = mockTimeout;

    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimeout);
    expect(timeoutRef.current).toBeNull();
  });

  it('ne devrait pas appeler clearTimeout si timeoutRef.current est null', () => {
    timeoutRef.current = null;

    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });

  it('devrait incrémenter timeoutIdRef', () => {
    timeoutIdRef.current = 5;

    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(timeoutIdRef.current).toBe(6);
  });

  it('devrait mettre isPausedRef à false', () => {
    isPausedRef.current = true;

    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(isPausedRef.current).toBe(false);
  });

  it('devrait mettre lastPausedAnchorIdRef à null', () => {
    lastPausedAnchorIdRef.current = 'anchor1';

    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(lastPausedAnchorIdRef.current).toBeNull();
  });

  it('devrait dispatcher setAutoScrollTemporarilyPaused(false)', () => {
    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(false));
  });

  it('devrait effectuer toutes les actions en une seule fois', () => {
    const mockTimeout = setTimeout(() => {}, 1000);
    timeoutRef.current = mockTimeout;
    timeoutIdRef.current = 10;
    isPausedRef.current = true;
    lastPausedAnchorIdRef.current = 'anchor1';

    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, mockDispatch);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(mockTimeout);
    expect(timeoutRef.current).toBeNull();
    expect(timeoutIdRef.current).toBe(11);
    expect(isPausedRef.current).toBe(false);
    expect(lastPausedAnchorIdRef.current).toBeNull();
    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(false));
  });
});

