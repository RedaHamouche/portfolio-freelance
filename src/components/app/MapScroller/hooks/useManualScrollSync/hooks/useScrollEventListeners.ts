import { useEffect } from 'react';

/**
 * Hook pour gérer les event listeners de scroll
 * Gère l'ajout et le nettoyage des listeners (wheel, touch, scroll)
 * FIX: N'attache les listeners que si le système est prêt (isScrollSynced && globalPathLength valide)
 */
export function useScrollEventListeners(
  handleUserInteraction: (event?: Event) => void,
  handleScroll: () => void,
  refs: {
    rafIdRef: { current: number | null };
    easingRafIdRef: { current: number | null };
    scrollEndTimeoutRef: { current: NodeJS.Timeout | null };
  },
  isReady: boolean = true
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // FIX: Ne pas attacher les listeners tant que le système n'est pas prêt
    if (!isReady) return;

    const touchStartHandler = (e: TouchEvent) => handleUserInteraction(e);
    const touchMoveHandler = (e: TouchEvent) => handleUserInteraction(e);

    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', touchStartHandler, { passive: true });
    window.addEventListener('touchmove', touchMoveHandler, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchstart', touchStartHandler);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('scroll', handleScroll);
      if (refs.rafIdRef.current !== null) {
        cancelAnimationFrame(refs.rafIdRef.current);
      }
      if (refs.easingRafIdRef.current !== null) {
        cancelAnimationFrame(refs.easingRafIdRef.current);
      }
      // OPTIMISATION: Nettoyer le timeout au lieu du RAF
      if (refs.scrollEndTimeoutRef.current !== null) {
        clearTimeout(refs.scrollEndTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUserInteraction, handleScroll, isReady]);
  // Note: refs sont stables, pas besoin de les inclure dans les dépendances
}

