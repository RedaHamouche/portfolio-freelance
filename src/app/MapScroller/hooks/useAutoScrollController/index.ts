import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress, setAutoScrollTemporarilyPaused, setIsScrolling, setLastScrollDirection } from '@/store/scrollSlice';
import { useRafLoop } from '@/hooks/useRafLoop';
import { AUTO_SCROLL_SPEED, SCROLL_CONFIG, type AutoScrollDirection } from '@/config';
import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';
import { createPathDomain } from '@/templating/domains/path';
import { useBreakpoint } from '@/hooks/useBreakpointValue';

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
  const isDesktop = useBreakpoint('>=desktop');
  const pathDomain = useMemo(() => createPathDomain(), []);
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
    
    // Tracker la direction du scroll
    const direction = autoScrollDirection > 0 ? 'forward' : 'backward';
    dispatch(setLastScrollDirection(direction));
    
    dispatch(setProgress(newProgress));
    
    // Pause sur anchor
    const anchor = pathDomain.getNextAnchor(prevProgressRef.current, newProgress, SCROLL_CONFIG.ANCHOR_TOLERANCE, isDesktop);
    if (anchor && anchor.anchorId && anchor.anchorId !== lastPausedAnchorIdRef.current) {
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
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLengthRef.current);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
    const targetScrollY = calculateScrollYFromProgress(newProgress, maxScroll);
    window.scrollTo({ top: targetScrollY, behavior: 'auto' });
  }, [isAutoPlaying, autoScrollDirection, dispatch, start, pathDomain, isDesktop]);

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