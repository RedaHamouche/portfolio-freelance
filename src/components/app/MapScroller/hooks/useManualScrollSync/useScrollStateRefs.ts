import { useRef } from 'react';

/**
 * Hook personnalisé pour regrouper toutes les refs de gestion d'état du scroll
 * Améliore l'organisation et la lisibilité du code
 */
export const useScrollStateRefs = (initialIsAutoPlaying: boolean) => {
  const isInitializedRef = useRef(false);
  const lastInitializedPathLengthRef = useRef<number>(0);
  const scrollYRef = useRef(0);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);
  const easingRafIdRef = useRef<number | null>(null);
  const isEasingActiveRef = useRef(false);
  const isAutoPlayingRef = useRef(initialIsAutoPlaying);
  const prevIsAutoPlayingRef = useRef(initialIsAutoPlaying);
  const lastScrollDirectionRef = useRef<string | null>(null);

  return {
    isInitializedRef,
    lastInitializedPathLengthRef,
    scrollYRef,
    scrollEndTimeoutRef,
    rafIdRef,
    pendingUpdateRef,
    easingRafIdRef,
    isEasingActiveRef,
    isAutoPlayingRef,
    prevIsAutoPlayingRef,
    lastScrollDirectionRef,
  };
};

