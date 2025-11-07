import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook pour gérer une boucle d'animation stable avec requestAnimationFrame.
 * La callback la plus récente est toujours utilisée.
 */
export function useRafLoop() {
  const rafRef = useRef<number | null>(null);
  const cbRef = useRef<FrameRequestCallback | null>(null);

  // Fonction pour démarrer la boucle
  const start = useCallback((cb: FrameRequestCallback) => {
    // Toujours mettre à jour le callback, même si la boucle est déjà en cours
    // Cela permet de changer la direction de l'autoplay sans le mettre en pause
    cbRef.current = cb;
    if (rafRef.current === null) {
      const loop = (time: number) => {
        if (cbRef.current) cbRef.current(time);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
  }, []);

  // Fonction pour arrêter la boucle
  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    cbRef.current = null;
  }, []);

  // Cleanup automatique
  useEffect(() => stop, [stop]);

  return { start, stop, rafRef };
} 