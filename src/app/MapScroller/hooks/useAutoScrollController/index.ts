import { useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress, setAutoScrollTemporarilyPaused, setIsScrolling } from '@/store/scrollSlice';
import pathComponents from '@/templating/pathComponents.json';
import { AUTO_SCROLL_SPEED } from '@/config/autoScroll';
import { useRafLoop } from '@/hooks/useRafLoop';
import { SCROLL_CONFIG, type AutoScrollDirection } from '@/config/scroll';

const getNextAnchor = (from: number, to: number) => {
  return pathComponents.find(c => {
    if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
    const tol = SCROLL_CONFIG.ANCHOR_TOLERANCE;
    if (from < to) {
      return from < c.position.progress && c.position.progress <= to + tol;
    } else {
      return to - tol <= c.position.progress && c.position.progress < from;
    }
  });
};

export function useAutoScrollController({
  isAutoPlaying,
  autoScrollDirection,
  globalPathLength,
  progress
}: {
  isAutoPlaying: boolean,
  autoScrollDirection: AutoScrollDirection,
  globalPathLength: number,
  progress: number
}) {
  const dispatch = useDispatch();
  const { start, stop } = useRafLoop();
  const isPausedRef = useRef(false);
  const lastPausedAnchorIdRef = useRef<string | null>(null);
  const prevProgressRef = useRef(progress);
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animateRef = useRef<FrameRequestCallback | null>(null);

  // Synchronisation optimisée des refs
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  useEffect(() => {
    prevProgressRef.current = progress;
  }, [progress]);

  const animate = useCallback(() => {
    if (!isAutoPlaying) return;
    if (isPausedRef.current) return;
    
    const dt = SCROLL_CONFIG.FRAME_DELAY / 1000; // approx 60fps
    const currentProgress = progressRef.current;
    const newProgress = (currentProgress + autoScrollDirection * AUTO_SCROLL_SPEED * dt + 1) % 1;
    dispatch(setProgress(newProgress));
    
    // Pause sur anchor
    const anchor = getNextAnchor(prevProgressRef.current, newProgress);
    if (anchor && anchor.anchorId !== lastPausedAnchorIdRef.current) {
      isPausedRef.current = true;
      lastPausedAnchorIdRef.current = anchor.anchorId;
      dispatch(setAutoScrollTemporarilyPaused(true));
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        isPausedRef.current = false;
        dispatch(setAutoScrollTemporarilyPaused(false));
        
        // Avancer légèrement pour sortir de la zone de l'anchor
        const bump = SCROLL_CONFIG.ANCHOR_BUMP * autoScrollDirection;
        const newProgressAfterPause = (progressRef.current + bump + 1) % 1;
        dispatch(setProgress(newProgressAfterPause));
        
        if (animateRef.current) {
          start(animateRef.current);
        }
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
    const fakeScrollHeight = Math.round(globalPathLengthRef.current * SCROLL_CONFIG.SCROLL_PER_PX);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    const targetScrollY = (1 - newProgress) * maxScroll;
    window.scrollTo(0, targetScrollY);
  }, [isAutoPlaying, autoScrollDirection, dispatch, start]);

  // Stocker la référence de animate
  useEffect(() => {
    animateRef.current = animate;
  }, [animate]);

  const startAutoScroll = useCallback(() => {
    dispatch(setIsScrolling(true));
    stop();
    start(animate);
  }, [start, stop, animate, dispatch]);

  const stopAutoScroll = useCallback(() => {
    dispatch(setIsScrolling(false));
    stop();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [stop, dispatch]);

  // Cleanup des timeouts au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { startAutoScroll, stopAutoScroll };
} 