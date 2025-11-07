import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setIsScrolling } from '@/store/scrollSlice';
import { useManualScrollSync } from '../useManualScrollSync';
import { useDirectionalScrollHandler } from '../useDirectionalScrollHandler';
import { useAutoPlay } from '../useAutoPlay';
import { type ScrollDirection } from '@/config';

export const useScrollManager = (isScrollSynced: boolean = true) => {
  const dispatch = useDispatch();
  const direction = useSelector((state: RootState) => state.scroll.direction) as ScrollDirection;
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);

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

  // Auto-scroll (play/pause, direction, anchor) - Nouvelle implémentation DDD
  const { startAutoPlay, stopAutoPlay } = useAutoPlay({
    globalPathLength,
    progress
  });
  
  // Adapter les noms pour compatibilité avec l'ancien code
  const startAutoScroll = startAutoPlay;
  const stopAutoScroll = stopAutoPlay;

  return {
    startDirectionalScroll,
    stopDirectionalScroll,
    startAutoScroll,
    stopAutoScroll,
    handleScrollState
  };
}; 