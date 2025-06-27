import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '../../../../store/scrollSlice';
import { useRafLoop } from '../../../../hooks/useRafLoop';

export function useDirectionalScrollHandler({
  direction,
  speed,
  globalPathLength,
  progress
}: {
  direction: 'haut' | 'bas' | null,
  speed: number,
  globalPathLength: number,
  progress: number
}) {
  const dispatch = useDispatch();
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  const { start, stop } = useRafLoop();

  // Sync refs
  progressRef.current = progress;
  globalPathLengthRef.current = globalPathLength;

  const animate = useCallback((timestamp: number) => {
    // On suppose que le timestamp initial est correct
    if (!direction) return;
    const pxPerMs = speed / 1000;
    const newProgress = (progressRef.current + (direction === 'bas' ? 1 : -1) * (pxPerMs * 16 / globalPathLengthRef.current) + 1) % 1;
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