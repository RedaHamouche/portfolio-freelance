import { useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress, setIsScrolling, setLastScrollDirection } from '@/store/scrollSlice';
import { useRafLoop } from '@/hooks/useRafLoop';
import { SCROLL_CONFIG, type ScrollDirection } from '@/config';

export function useDirectionalScrollHandler({
  direction,
  speed,
  globalPathLength,
  progress
}: {
  direction: ScrollDirection,
  speed: number,
  globalPathLength: number,
  progress: number
}) {
  const dispatch = useDispatch();
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  const { start, stop } = useRafLoop();

  // Synchronisation optimisée des refs
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  const animate = useCallback(() => {
    if (!direction) return;
    const pxPerMs = speed / 1000;
    const scrollDelta = direction === 'bas' ? 1 : -1;
    const newProgress = (progressRef.current + scrollDelta * (pxPerMs * SCROLL_CONFIG.FRAME_DELAY / globalPathLengthRef.current) + 1) % 1;
    
    // Tracker la direction du scroll (bas = forward, haut = backward avec le sens inversé)
    const scrollDirection = direction === 'bas' ? 'forward' : 'backward';
    dispatch(setLastScrollDirection(scrollDirection));
    
    dispatch(setProgress(newProgress));
  }, [direction, speed, dispatch]);

  const startDirectionalScroll = useCallback(() => {
    if (!direction) return;
    dispatch(setIsScrolling(true));
    start(animate);
  }, [direction, start, animate, dispatch]);

  const stopDirectionalScroll = useCallback(() => {
    dispatch(setIsScrolling(false));
    stop();
  }, [stop, dispatch]);

  return { startDirectionalScroll, stopDirectionalScroll };
} 