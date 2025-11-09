import { useDispatch } from 'react-redux';
import { setAutoScrollTemporarilyPaused } from '@/store/scrollSlice';

/**
 * Crée le callback pour reprendre l'animation après une pause
 */
export function createResumeAfterPauseCallback(
  currentTimeoutId: number,
  currentAnchorId: string,
  timeoutIdRef: React.MutableRefObject<number>,
  isModalOpenRef: React.MutableRefObject<boolean>,
  isAutoPlayingRef: React.MutableRefObject<boolean>,
  lastPausedAnchorIdRef: React.MutableRefObject<string | null>,
  isPausedRef: React.MutableRefObject<boolean>,
  animateRef: React.MutableRefObject<FrameRequestCallback | null>,
  start: (callback: FrameRequestCallback) => void,
  dispatch: ReturnType<typeof useDispatch>
): () => void {
  return () => {
    // CRITIQUE: Vérifier que ce timeout est toujours valide
    // Si timeoutIdRef a changé, cela signifie qu'un nouveau timeout a été créé (redémarrage rapide)
    if (timeoutIdRef.current !== currentTimeoutId) {
      return; // Ce timeout est obsolète, ne rien faire
    }
    
    // Vérifier que la modal n'est pas ouverte avant de reprendre
    if (isModalOpenRef.current) {
      return;
    }
    
    // Vérifier que l'autoplay est toujours actif
    if (!isAutoPlayingRef.current) {
      return;
    }
    
    // Vérifier que l'anchor n'a pas changé (protection contre les redémarrages rapides)
    // Si lastPausedAnchorIdRef a changé, cela signifie qu'on a redémarré l'autoplay
    if (lastPausedAnchorIdRef.current !== currentAnchorId) {
      return; // L'anchor a changé, ne pas reprendre
    }
    
    // Vérifier que isPausedRef est toujours true (sinon on a déjà repris ou redémarré)
    if (!isPausedRef.current) {
      return; // On n'est plus en pause, ne rien faire
    }
    
    isPausedRef.current = false;
    dispatch(setAutoScrollTemporarilyPaused(false));

    // Reprendre l'animation normalement, sans bump
    // Le cooldown de 5 secondes empêchera la redétection de l'anchor
    if (animateRef.current) {
      start(animateRef.current);
    }
  };
}

