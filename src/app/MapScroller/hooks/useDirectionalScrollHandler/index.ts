import { useCallback, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '@/store/scrollSlice';
import { useRafLoop } from '@/hooks/useRafLoop';
import { SCROLL_CONFIG, type ScrollDirection } from '@/config/scroll';

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
    const newProgress = (progressRef.current + (direction === 'bas' ? 1 : -1) * (pxPerMs * SCROLL_CONFIG.FRAME_DELAY / globalPathLengthRef.current) + 1) % 1;
    dispatch(setProgress(newProgress));
  }, [direction, speed, dispatch]);

  const startDirectionalScroll = useCallback(() => {
    if (!direction) return;
    start(animate);
  }, [direction, start, animate]);

  const stopDirectionalScroll = useCallback(() => {
    stop();
  }, [stop]);

  return { startDirectionalScroll, stopDirectionalScroll };
} 