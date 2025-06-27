import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setIsScrolling, setProgress, setAutoScrollTemporarilyPaused } from '../../../store/scrollSlice';
import pathComponents from '@/templating/pathComponents.json';
import { AUTO_SCROLL_SPEED } from '@/config/autoScroll';
import gsap from 'gsap';

// Typage explicite pour robustesse
export type PathComponent = {
  id: string;
  type: string;
  displayName: string;
  anchorId: string;
  position: {
    progress: number;
  };
  autoScrollPauseTime?: number;
};
const typedPathComponents: PathComponent[] = pathComponents as PathComponent[];

const SCROLL_PER_PX = 1.5;

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

// Hook pour désactiver l'auto-scroll dès qu'un scroll manuel est détecté
export function useAutoScrollPauseOnManual() {
  const dispatch = useDispatch();
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const pauseAutoScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
      });
    };

    window.addEventListener('wheel', pauseAutoScroll, { passive: true });
    window.addEventListener('touchmove', pauseAutoScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', pauseAutoScroll);
      window.removeEventListener('touchmove', pauseAutoScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}

export const useScrollManager = () => {
  const dispatch = useDispatch();
  const gsapTickerRef = useRef<boolean>(false);
  const gsapStepRef = useRef<(() => void) | null>(null);
  const gsapPauseTimeoutRef = useRef<gsap.core.Tween | null>(null);
  const lastProgrammaticScroll = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const pauseStartTimeRef = useRef<number | null>(null);

  const isPausedRef = useRef(false);
  const lastPausedAnchorIdRef = useRef<string | null>(null);
  const prevProgressRef = useRef(0);
  const isAutoPlayingRef = useRef(false);

  const direction = useSelector((state: RootState) => state.scroll.direction);
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);

  useAutoScrollPauseOnManual();

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  // Centralise le cleanup GSAP
  const cleanupAutoScroll = useCallback(() => {
    if (gsapTickerRef.current && gsapStepRef.current) {
      gsap.ticker.remove(gsapStepRef.current);
      gsapTickerRef.current = false;
    }
    if (gsapPauseTimeoutRef.current) {
      gsapPauseTimeoutRef.current.kill();
      gsapPauseTimeoutRef.current = null;
    }
  }, []);

  // Fonction d'animation GSAP centralisée avec pause temporaire
  const animateAutoScrollWithGSAP = useCallback(() => {
    let lastTime = performance.now();
    
    const getNextAnchor = (from: number, to: number) => {
      return typedPathComponents.find(c => {
        if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
        const tol = 0.002;
        if (from < to) {
          return from < c.position.progress && c.position.progress <= to + tol;
        } else {
          return to - tol <= c.position.progress && c.position.progress < from;
        }
      });
    };

    const step = () => {
      if (!isAutoPlayingRef.current) return;
      if (isPausedRef.current) return;
      
      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      
      const currentProgress = prevProgressRef.current;
      const newProgress = (currentProgress + autoScrollDirection * AUTO_SCROLL_SPEED * dt + 1) % 1;

      // Vérifier si on franchit un anchor avec pause
      const anchor = getNextAnchor(prevProgressRef.current, newProgress);
      if (anchor && anchor.anchorId !== lastPausedAnchorIdRef.current) {
        // --- PAUSE TEMPORAIRE ---
        console.log('Début de pause temporaire pour', anchor.anchorId, 'durée:', anchor.autoScrollPauseTime);
        isPausedRef.current = true;
        lastPausedAnchorIdRef.current = anchor.anchorId;
        pauseStartTimeRef.current = performance.now();
        dispatch(setAutoScrollTemporarilyPaused(true));
        
        // Nettoyer le timeout précédent s'il existe
        if (gsapPauseTimeoutRef.current) {
          gsapPauseTimeoutRef.current.kill();
        }
        
        // Lancer le timeout de pause
        gsapPauseTimeoutRef.current = gsap.delayedCall((anchor.autoScrollPauseTime || 0) / 1000, () => {
          console.log('Pause terminée, reprise de l\'animation');
          isPausedRef.current = false;
          dispatch(setAutoScrollTemporarilyPaused(false));
          
          // Ajuster lastTime pour compenser le temps de pause
          if (pauseStartTimeRef.current) {
            const pauseDuration = performance.now() - pauseStartTimeRef.current;
            lastTimeRef.current = performance.now() - pauseDuration;
            pauseStartTimeRef.current = null;
          }
          
          gsapPauseTimeoutRef.current = null;
        });
        
        // NE PAS mettre à jour prevProgressRef pendant la pause
        // prevProgressRef.current = newProgress; // ← Cette ligne est supprimée
        return;
      }
      
      // Réinitialiser si on n'est plus sur un anchor
      if (!anchor) {
        lastPausedAnchorIdRef.current = null;
        dispatch(setAutoScrollTemporarilyPaused(false));
      }
      
      // Mettre à jour le progress seulement si on n'est pas en pause
      if (!isPausedRef.current) {
        dispatch(setProgress(newProgress));
        prevProgressRef.current = newProgress;
        
        // Synchroniser la position de scroll
        const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
        const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
        const targetScrollY = (1 - newProgress) * maxScroll;
        lastProgrammaticScroll.current = Date.now();
        window.scrollTo(0, targetScrollY);
      }
    };

    // Nettoyer avant de lancer
    cleanupAutoScroll();
    gsapStepRef.current = step;
    gsap.ticker.add(step);
    gsapTickerRef.current = true;
  }, [autoScrollDirection, dispatch, globalPathLength, cleanupAutoScroll]);

  // Hook d'initialisation/cleanup de l'auto-scroll
  const setupAutoScroll = useCallback(() => {
    cleanupAutoScroll();
    if (isAutoPlaying) {
      animateAutoScrollWithGSAP();
    }
    return cleanupAutoScroll;
  }, [isAutoPlaying, animateAutoScrollWithGSAP, cleanupAutoScroll]);

  // Références pour accéder au state actuel dans les callbacks
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  
  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  useEffect(() => {
    prevProgressRef.current = progress;
  }, [progress]);

  const handleScrollState = useCallback((isScrolling: boolean) => {
    dispatch(setIsScrolling(isScrolling));
    if (gsapPauseTimeoutRef.current) gsapPauseTimeoutRef.current.kill();
    if (isScrolling) {
      gsapPauseTimeoutRef.current = gsap.delayedCall(150 / 1000, () => {
        dispatch(setIsScrolling(false));
      });
    }
  }, [dispatch]);

  // Scroll manuel
  const setupManualScroll = useCallback((useNativeScroll: boolean) => {
    if (!useNativeScroll) return;
    
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScrollState(true);
          const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
          const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
          let scrollY = window.scrollY;

          if (scrollY <= 0) {
            window.scrollTo(0, maxScroll - 2);
            scrollY = maxScroll - 2;
          } else if (scrollY >= maxScroll - 1) {
            window.scrollTo(1, 1);
            scrollY = 1;
          }

          const newProgress = computeScrollProgress(scrollY, maxScroll);
          dispatch(setProgress(newProgress));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [globalPathLength, handleScrollState, dispatch]);

  // Scroll directionnel (clavier)
  const setupDirectionalScroll = useCallback(() => {
    if (!direction) return;
    cleanupAutoScroll();
    let lastTimestamp: number | null = null;
    const move = () => {
      if (!direction) return;
      if (lastTimestamp === null) {
        lastTimestamp = performance.now();
        return;
      }
      const now = performance.now();
      const delta = now - lastTimestamp;
      lastTimestamp = now;
      const pxPerMs = speed / 1000;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + (direction === 'bas' ? 1 : -1) * (pxPerMs * delta / globalPathLengthRef.current) + 1) % 1;
      dispatch(setProgress(newProgress));
    };
    gsap.ticker.add(move);
    return () => {
      gsap.ticker.remove(move);
    };
  }, [direction, speed, dispatch, cleanupAutoScroll]);

  return {
    setupManualScroll,
    setupDirectionalScroll,
    setupAutoScroll,
    handleScrollState
  };
}; 