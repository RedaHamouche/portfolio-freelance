import { useRef, useEffect } from 'react';

/**
 * Hook personnalisé pour regrouper toutes les refs de useAutoPlay
 * Améliore l'organisation et la lisibilité du code
 * 
 * Les refs sont initialisées avec les valeurs passées et sont synchronisées
 * automatiquement via les useEffect dans ce hook
 */
export const useAutoPlayStateRefs = (
  isAutoPlaying: boolean,
  isModalOpen: boolean,
  progress: number,
  globalPathLength: number
) => {
  const isPausedRef = useRef(false);
  const lastPausedAnchorIdRef = useRef<string | null>(null);
  const lastPausedTimeRef = useRef<Map<string, number>>(new Map()); // Map<anchorId, timestamp>
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutIdRef = useRef<number>(0); // ID unique pour chaque timeout (protection contre les redémarrages rapides)
  const animateRef = useRef<FrameRequestCallback | null>(null);
  const isAutoPlayingRef = useRef(isAutoPlaying);
  const isModalOpenRef = useRef(isModalOpen);

  // Synchronisation des refs avec les valeurs actuelles
  // Note: Les useEffect dans useAutoPlay gèrent la synchronisation continue
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  return {
    isPausedRef,
    lastPausedAnchorIdRef,
    lastPausedTimeRef,
    progressRef,
    globalPathLengthRef,
    timeoutRef,
    timeoutIdRef,
    animateRef,
    isAutoPlayingRef,
    isModalOpenRef,
  };
};

