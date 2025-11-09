import { useDispatch } from 'react-redux';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';
import { createResumeAfterPauseCallback } from '../createResumeAfterPauseCallback';

/**
 * Gère la pause sur un anchor
 */
export function handlePauseOnAnchor(
  anchorId: string,
  pauseDuration: number,
  lastPausedTimeRef: React.MutableRefObject<Map<string, number>>,
  isPausedRef: React.MutableRefObject<boolean>,
  lastPausedAnchorIdRef: React.MutableRefObject<string | null>,
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  timeoutIdRef: React.MutableRefObject<number>,
  isModalOpenRef: React.MutableRefObject<boolean>,
  isAutoPlayingRef: React.MutableRefObject<boolean>,
  animateRef: React.MutableRefObject<FrameRequestCallback | null>,
  start: (callback: FrameRequestCallback) => void,
  dispatch: ReturnType<typeof useDispatch>
): void {
  isPausedRef.current = true;
  lastPausedAnchorIdRef.current = anchorId;
  
  // Enregistrer le temps de pause pour ce anchor (cooldown de 5 secondes)
  lastPausedTimeRef.current.set(anchorId, performance.now());
  
  dispatch(setAutoScrollTemporarilyPaused(true));

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  
  // Stocker l'anchorId actuel pour vérifier qu'il n'a pas changé quand le timeout se déclenche
  const currentAnchorId = anchorId;
  
  // Générer un ID unique pour ce timeout (protection contre les redémarrages rapides)
  timeoutIdRef.current += 1;
  const currentTimeoutId = timeoutIdRef.current;
  
  const resumeCallback = createResumeAfterPauseCallback(
    currentTimeoutId,
    currentAnchorId,
    timeoutIdRef,
    isModalOpenRef,
    isAutoPlayingRef,
    lastPausedAnchorIdRef,
    isPausedRef,
    animateRef,
    start,
    dispatch
  );
  
  timeoutRef.current = setTimeout(resumeCallback, pauseDuration);
}

