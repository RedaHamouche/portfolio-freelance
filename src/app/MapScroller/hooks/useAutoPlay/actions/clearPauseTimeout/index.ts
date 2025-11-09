import { useDispatch } from 'react-redux';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';

/**
 * Nettoie le timeout de pause et réinitialise les états associés
 */
export function clearPauseTimeout(
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  timeoutIdRef: React.MutableRefObject<number>,
  isPausedRef: React.MutableRefObject<boolean>,
  lastPausedAnchorIdRef: React.MutableRefObject<string | null>,
  dispatch: ReturnType<typeof useDispatch>
): void {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
  timeoutIdRef.current += 1;
  isPausedRef.current = false;
  lastPausedAnchorIdRef.current = null;
  dispatch(setAutoScrollTemporarilyPaused(false));
}

