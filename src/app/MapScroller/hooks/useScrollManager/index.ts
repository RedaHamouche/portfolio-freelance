import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setIsScrolling } from '@/store/scrollSlice';
import { useManualScrollSync } from '../useManualScrollSync';
import { useDirectionalScrollHandler } from '../useDirectionalScrollHandler';
import { useAutoScrollController } from '../useAutoScrollController';
import { type ScrollDirection, type AutoScrollDirection } from '@/config';

export const useScrollManager = (isScrollSynced: boolean = true) => {
  const dispatch = useDispatch();
  const direction = useSelector((state: RootState) => state.scroll.direction) as ScrollDirection;
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection) as AutoScrollDirection;
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);

  // Scroll manuel natif
  const handleScrollState = useCallback((isScrolling: boolean) => {
    dispatch(setIsScrolling(isScrolling));
  }, [dispatch]);
  
  useManualScrollSync(globalPathLength, handleScrollState, isScrollSynced);

  // Scroll directionnel (clavier/boutons)
  const { startDirectionalScroll, stopDirectionalScroll } = useDirectionalScrollHandler({
    direction,
    speed,
    globalPathLength,
    progress
  });

  // Auto-scroll (play/pause, direction, anchor)
  const { startAutoScroll, stopAutoScroll } = useAutoScrollController({
    isAutoPlaying,
    autoScrollDirection,
    globalPathLength,
    progress
  });

  return {
    startDirectionalScroll,
    stopDirectionalScroll,
    startAutoScroll,
    stopAutoScroll,
    handleScrollState
  };
}; 