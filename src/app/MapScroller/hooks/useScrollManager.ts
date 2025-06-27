import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setIsScrolling, setProgress, setAutoScrollTemporarilyPaused } from '../../../store/scrollSlice';
import pathComponents from '@/templating/pathComponents.json';
import { AUTO_SCROLL_SPEED } from '@/config/autoScroll';

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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const lastProgrammaticScroll = useRef(0);

  const isPausedRef = useRef(false);
  const lastPausedAnchorIdRef = useRef<string | null>(null);
  const prevProgressRef = useRef(0);

  const direction = useSelector((state: RootState) => state.scroll.direction);
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);

  // Appelle le hook de pause auto-scroll sur scroll manuel
  useAutoScrollPauseOnManual();

  // Références pour accéder au state actuel dans les callbacks
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  
  // Initialisation robuste des refs
  useEffect(() => {
    progressRef.current = progress;
    prevProgressRef.current = progress;
  }, [progress]);
  
  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  const handleScrollState = useCallback((isScrolling: boolean) => {
    dispatch(setIsScrolling(isScrolling));
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (isScrolling) {
      scrollTimeoutRef.current = setTimeout(() => {
        dispatch(setIsScrolling(false));
      }, 150);
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
    
    if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);

    let lastTimestamp: number | null = null;
    const move = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const pxPerMs = speed / 1000;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + (direction === 'bas' ? 1 : -1) * (pxPerMs * delta / globalPathLengthRef.current) + 1) % 1;
      dispatch(setProgress(newProgress));

      autoScrollRafRef.current = requestAnimationFrame(move);
    };

    autoScrollRafRef.current = requestAnimationFrame(move);
    return () => {
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, [direction, speed, dispatch]);

  // Fonction pour trouver le prochain anchor avec pause
  const getNextAnchor = useCallback((from: number, to: number) => {
    return pathComponents.find(c => {
      if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
      const tol = 0.002;
      if (from < to) {
        return from < c.position.progress && c.position.progress <= to + tol;
      } else {
        return to - tol <= c.position.progress && c.position.progress < from;
      }
    });
  }, []);

  // Animation auto-scroll avec pause temporaire
  const startAutoScrollAnimation = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
    }
    
    // S'assurer que prevProgressRef est synchronisé avec le progress actuel
    prevProgressRef.current = progressRef.current;
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (!isAutoPlaying) return;
      if (isPausedRef.current) return;
      
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + autoScrollDirection * AUTO_SCROLL_SPEED * dt + 1) % 1;
      dispatch(setProgress(newProgress));

      // Vérifier si on franchit un anchor avec pause
      const anchor = getNextAnchor(prevProgressRef.current, newProgress);
      if (anchor && anchor.anchorId !== lastPausedAnchorIdRef.current) {
        isPausedRef.current = true;
        lastPausedAnchorIdRef.current = anchor.anchorId;
        dispatch(setAutoScrollTemporarilyPaused(true));
        
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isPausedRef.current = false;
          dispatch(setAutoScrollTemporarilyPaused(false));
          
          // Avancer légèrement pour sortir de la zone de l'anchor
          const bump = 0.002 * autoScrollDirection;
          const newProgressAfterPause = (progressRef.current + bump + 1) % 1;
          dispatch(setProgress(newProgressAfterPause));
          
          startAutoScrollAnimation(); // Relance explicite
        }, anchor.autoScrollPauseTime);
        
        prevProgressRef.current = newProgress;
        return;
      }
      
      if (!anchor) {
        lastPausedAnchorIdRef.current = null;
        dispatch(setAutoScrollTemporarilyPaused(false));
      }
      
      prevProgressRef.current = newProgress;

      // Synchroniser la position de scroll
      const fakeScrollHeight = Math.round(globalPathLengthRef.current * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      const targetScrollY = (1 - newProgress) * maxScroll;
      lastProgrammaticScroll.current = Date.now();
      window.scrollTo(0, targetScrollY);

      autoScrollRafRef.current = requestAnimationFrame(animate);
    };
    
    autoScrollRafRef.current = requestAnimationFrame(animate);
  }, [isAutoPlaying, autoScrollDirection, dispatch, getNextAnchor]);

  const stopAutoScrollAnimation = useCallback(() => {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  // Gestion Play/Pause global
  useEffect(() => {
    if (isAutoPlaying) {
      stopAutoScrollAnimation();
      startAutoScrollAnimation();
    } else {
      stopAutoScrollAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying, startAutoScrollAnimation, stopAutoScrollAnimation]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopAutoScrollAnimation();
    };
  }, [stopAutoScrollAnimation]);

  return {
    setupManualScroll,
    setupDirectionalScroll,
    setupAutoScroll: startAutoScrollAnimation,
    handleScrollState
  };
}; 