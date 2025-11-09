import { useCallback } from 'react';
import type { ManualScrollSyncUseCase } from '../ManualScrollSyncUseCase';
import { updateScrollDirection } from '../utils/updateScrollDirection';
import type { ScrollContextType } from '@/contexts/ScrollContext';
import type { ProgressUpdateService } from '../../../services/ProgressUpdateService';
import { isBrowser } from '@/utils/ssr/isBrowser';

/**
 * Interface pour les refs nécessaires à useEasingLoop
 */
export interface UseEasingLoopRefs {
  easingRafIdRef: { current: number | null };
  isEasingActiveRef: { current: boolean };
  isAutoPlayingRef: { current: boolean };
  lastScrollDirectionRef: { current: string | null };
}

/**
 * Hook pour gérer la boucle d'easing
 * Gère l'animation continue du scroll avec easing
 */
export function useEasingLoop(
  scrollContext: ScrollContextType,
  refs: UseEasingLoopRefs,
  progressUpdateService: ProgressUpdateService,
  isModalOpen: boolean,
  getUseCase: () => ManualScrollSyncUseCase
) {
  // Boucle d'easing
  const easingLoop = useCallback(() => {
    if (!isBrowser()) return;
    if (isModalOpen) {
      refs.isEasingActiveRef.current = false;
      refs.easingRafIdRef.current = null;
      return;
    }

    const useCase = getUseCase();
    const shouldContinue = useCase.animateEasing();
    const progressFromUseCase = useCase.getCurrentProgress();
    progressUpdateService.updateProgressOnly(progressFromUseCase);

    // Tracker la direction seulement si l'autoplay n'est pas actif et si elle a changé
    updateScrollDirection(useCase, progressUpdateService, refs.isAutoPlayingRef, refs.lastScrollDirectionRef);

    if (shouldContinue) {
      refs.easingRafIdRef.current = requestAnimationFrame(easingLoop);
    } else {
      refs.isEasingActiveRef.current = false;
      refs.easingRafIdRef.current = null;
    }
  }, [
    progressUpdateService,
    isModalOpen,
    getUseCase,
    refs.isEasingActiveRef,
    refs.easingRafIdRef,
    refs.isAutoPlayingRef,
    refs.lastScrollDirectionRef,
  ]);

  const startEasingLoop = useCallback(() => {
    if (!refs.isEasingActiveRef.current) {
      refs.isEasingActiveRef.current = true;
      refs.easingRafIdRef.current = requestAnimationFrame(easingLoop);
    }
  }, [easingLoop, refs.isEasingActiveRef, refs.easingRafIdRef]);

  return {
    easingLoop,
    startEasingLoop,
  };
}

