import { useRef, useEffect } from 'react';

/**
 * Hook personnalisé pour regrouper toutes les refs de useDirectionalScrollHandler
 * Améliore l'organisation et la lisibilité du code
 */
export const useDirectionalScrollStateRefs = (
  progress: number,
  globalPathLength: number
) => {
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);

  // Synchronisation des refs avec les valeurs actuelles
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  return {
    progressRef,
    globalPathLengthRef,
  };
};

