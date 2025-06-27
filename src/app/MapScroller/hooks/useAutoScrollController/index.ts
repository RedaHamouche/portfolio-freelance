import { useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress, setAutoScrollTemporarilyPaused } from '../../../../store/scrollSlice';
import pathComponents from '@/templating/pathComponents.json';
import { AUTO_SCROLL_SPEED } from '@/config/autoScroll';
import { useRafLoop } from '../../../../hooks/useRafLoop';

const SCROLL_PER_PX = 1.5;

const getNextAnchor = (from: number, to: number) => {
  return pathComponents.find(c => {
    if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
    const tol = 0.002;
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
  autoScrollDirection: 1 | -1,
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

  // Sync refs
  progressRef.current = progress;
  globalPathLengthRef.current = globalPathLength;

  const animate = useCallback((now: number) => {
    if (!isAutoPlaying) return;
    if (isPausedRef.current) return;
    const dt = 16 / 1000; // approx 60fps
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
        const bump = 0.002 * autoScrollDirection;
        const newProgressAfterPause = (progressRef.current + bump + 1) % 1;
        dispatch(setProgress(newProgressAfterPause));
        start(animate);
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
    window.scrollTo(0, targetScrollY);
  }, [isAutoPlaying, autoScrollDirection, dispatch]);

  const startAutoScroll = useCallback(() => {
    stop();
    start(animate);
  }, [start, stop, animate]);

  const stopAutoScroll = useCallback(() => {
    stop();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [stop]);

  return { startAutoScroll, stopAutoScroll };
} 