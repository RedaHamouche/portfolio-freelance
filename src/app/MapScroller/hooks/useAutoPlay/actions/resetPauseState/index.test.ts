import { resetPauseState } from './index';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';

describe('resetPauseState', () => {
  let lastPausedAnchorIdRef: React.MutableRefObject<string | null>;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    lastPausedAnchorIdRef = { current: null };
    mockDispatch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ne devrait rien faire si shouldPause est true', () => {
    lastPausedAnchorIdRef.current = 'anchor1';

    resetPauseState(true, lastPausedAnchorIdRef, mockDispatch);

    expect(lastPausedAnchorIdRef.current).toBe('anchor1');
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si lastPausedAnchorIdRef.current est null', () => {
    lastPausedAnchorIdRef.current = null;

    resetPauseState(false, lastPausedAnchorIdRef, mockDispatch);

    expect(lastPausedAnchorIdRef.current).toBeNull();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('devrait réinitialiser l\'état si shouldPause est false et lastPausedAnchorIdRef.current n\'est pas null', () => {
    lastPausedAnchorIdRef.current = 'anchor1';

    resetPauseState(false, lastPausedAnchorIdRef, mockDispatch);

    expect(lastPausedAnchorIdRef.current).toBeNull();
    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(false));
  });

  it('devrait réinitialiser l\'état même si lastPausedAnchorIdRef.current est une chaîne vide', () => {
    lastPausedAnchorIdRef.current = '';

    resetPauseState(false, lastPausedAnchorIdRef, mockDispatch);

    expect(lastPausedAnchorIdRef.current).toBeNull();
    expect(mockDispatch).toHaveBeenCalledWith(setAutoScrollTemporarilyPaused(false));
  });
});

