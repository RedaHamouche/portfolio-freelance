import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '@/store/scrollSlice';
import type { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import { updateScrollDirection } from '../utils/updateScrollDirection';
import type { ScrollContextType } from '../../../contexts/ScrollContext';

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
  dispatch: ReturnType<typeof useDispatch>,
  isModalOpen: boolean,
  getUseCase: () => ManualScrollSyncUseCase
) {
  // Boucle d'easing
  const easingLoop = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) {
      refs.isEasingActiveRef.current = false;
      refs.easingRafIdRef.current = null;
      return;
    }

    const useCase = getUseCase();
    const shouldContinue = useCase.animateEasing();
    const progressFromUseCase = useCase.getCurrentProgress();
    dispatch(setProgress(progressFromUseCase));

    // Tracker la direction seulement si l'autoplay n'est pas actif et si elle a changé
    updateScrollDirection(useCase, dispatch, refs.isAutoPlayingRef, refs.lastScrollDirectionRef);

    if (shouldContinue) {
      refs.easingRafIdRef.current = requestAnimationFrame(easingLoop);
    } else {
      refs.isEasingActiveRef.current = false;
      refs.easingRafIdRef.current = null;
    }
  }, [
    dispatch,
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

