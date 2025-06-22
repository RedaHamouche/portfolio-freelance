import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setIsScrolling, setProgress, setAutoScrolling } from '../../../store/scrollSlice';

const SCROLL_PER_PX = 1.5;

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

// Hook pour désactiver l'auto-scroll dès qu'un scroll manuel est détecté
export function useAutoScrollPauseOnManual() {
  const dispatch = useDispatch();
  const isAutoScrolling = useSelector((state: RootState) => state.scroll.isAutoScrolling);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAutoScrolling) return;

    const pauseAutoScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        dispatch(setAutoScrolling(false));
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
  }, [isAutoScrolling, dispatch]);
}

export const useScrollManager = () => {
  const dispatch = useDispatch();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastProgrammaticScroll = useRef(0);

  const direction = useSelector((state: RootState) => state.scroll.direction);
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const isAutoScrolling = useSelector((state: RootState) => state.scroll.isAutoScrolling);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);

  // Appelle le hook de pause auto-scroll sur scroll manuel
  useAutoScrollPauseOnManual();

  // Références pour accéder au state actuel dans les callbacks
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  
  useEffect(() => {
    progressRef.current = progress;
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
            if (isAutoScrolling) {
              lastProgrammaticScroll.current = Date.now();
            }
            window.scrollTo(0, maxScroll - 2);
            scrollY = maxScroll - 2;
          } else if (scrollY >= maxScroll - 1) {
            if (isAutoScrolling) {
              lastProgrammaticScroll.current = Date.now();
            }
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
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    let lastTimestamp: number | null = null;
    const move = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const pxPerMs = speed / 1000;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + (direction === 'bas' ? 1 : -1) * (pxPerMs * delta / globalPathLengthRef.current) + 1) % 1;
      dispatch(setProgress(newProgress));

      animationRef.current = requestAnimationFrame(move);
    };

    animationRef.current = requestAnimationFrame(move);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, speed, dispatch]);

  // Scroll automatique
  const setupAutoScroll = useCallback((isAutoScrolling: boolean) => {
    if (!isAutoScrolling) {
      // Synchroniser la position de scroll quand on arrête
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      const targetScrollY = (1 - progress) * maxScroll;
      if (isAutoScrolling) {
        lastProgrammaticScroll.current = Date.now();
      }
      window.scrollTo(0, targetScrollY);
      return;
    }
    
    let raf: number;
    let lastTime = performance.now();
    const speed = 0.04;

    const animate = (now: number) => {
      if (!isAutoScrolling) return;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + autoScrollDirection * speed * dt) % 1;
      dispatch(setProgress(newProgress));
      
      // Synchroniser la position de scroll en temps réel
      const fakeScrollHeight = Math.round(globalPathLengthRef.current * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      const targetScrollY = (1 - newProgress) * maxScroll;
      if (isAutoScrolling) {
        lastProgrammaticScroll.current = Date.now();
      }
      window.scrollTo(0, targetScrollY);
      
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [isAutoScrolling, progress, globalPathLength, autoScrollDirection, dispatch]);

  // Synchronisation Play/Pause pour éviter les décalages
  useEffect(() => {
    const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);

    if (isAutoScrolling) {
      // Quand on passe en Play, synchronise le scroll natif avec le progress
      const targetScrollY = (1 - progress) * maxScroll;
      if (isAutoScrolling) {
        lastProgrammaticScroll.current = Date.now();
      }
      window.scrollTo(0, targetScrollY);
    } else {
      // Quand on passe en Pause, synchronise le progress avec la position de scroll réelle
      const scrollY = window.scrollY;
      const newProgress = computeScrollProgress(scrollY, maxScroll);
      dispatch(setProgress(newProgress));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoScrolling]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return {
    setupManualScroll,
    setupDirectionalScroll,
    setupAutoScroll,
    handleScrollState
  };
}; 