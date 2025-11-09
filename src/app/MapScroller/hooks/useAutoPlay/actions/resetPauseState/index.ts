import { useDispatch } from 'react-redux';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';

/**
 * Réinitialise l'état de pause si on n'est plus sur un anchor
 */
export function resetPauseState(
  shouldPause: boolean,
  lastPausedAnchorIdRef: React.MutableRefObject<string | null>,
  dispatch: ReturnType<typeof useDispatch>
): void {
  if (!shouldPause && lastPausedAnchorIdRef.current !== null) {
    lastPausedAnchorIdRef.current = null;
    dispatch(setAutoScrollTemporarilyPaused(false));
  }
}

