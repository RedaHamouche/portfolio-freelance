import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAutoScrollTemporarilyPaused, setIsScrolling } from '@/store/scrollSlice';
import { RootState } from '@/store';
import { useRafLoop } from '@/hooks/useRafLoop';
import { AUTO_SCROLL_CONFIG, SCROLL_CONFIG, type AutoScrollDirection } from '@/config';
import { useTemplatingContext } from '@/contexts/TemplatingContext';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { syncScrollPosition } from '@/utils/scrollUtils/syncScrollPosition';
import { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';

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
  const isModalOpen = useSelector((state: RootState) => state.modal.isOpen);
  const { start, stop } = useRafLoop();
  const isDesktop = useBreakpoint('>=desktop');
  const { pathDomain } = useTemplatingContext();
  const progressUpdateService = useMemo(() => new ProgressUpdateService(dispatch), [dispatch]);
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
    // Utiliser la vitesse appropriée selon le device
    const speed = isDesktop ? AUTO_SCROLL_CONFIG.desktop.speed : AUTO_SCROLL_CONFIG.mobile.speed;
    const newProgress = (currentProgress + autoScrollDirection * speed * dt + 1) % 1;
    
    // Tracker la direction du scroll et mettre à jour le progress (source unique de vérité)
    const direction = autoScrollDirection > 0 ? 'forward' : 'backward';
    progressUpdateService.updateProgressWithDirection(newProgress, direction);
    
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
        progressUpdateService.updateProgressOnly(newProgressAfterPause);
        
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
    
    // Synchroniser la position de scroll (source unique de vérité)
    syncScrollPosition(newProgress, globalPathLengthRef.current, isModalOpen, {
      behavior: 'auto',
      logPrefix: '[useAutoScrollController]',
    });
  }, [isAutoPlaying, autoScrollDirection, dispatch, start, pathDomain, isDesktop, isModalOpen, progressUpdateService]);

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