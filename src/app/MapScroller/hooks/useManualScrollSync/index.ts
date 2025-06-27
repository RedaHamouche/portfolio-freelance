import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '../../../../store/scrollSlice';

const SCROLL_PER_PX = 1.5;

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

export function useManualScrollSync(globalPathLength: number, onScrollState?: (isScrolling: boolean) => void) {
  const dispatch = useDispatch();

  const handleScroll = useCallback(() => {
    if (onScrollState) onScrollState(true);
    const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    let scrollY = window.scrollY;
    if (scrollY <= 0) {
      window.scrollTo(0, maxScroll - 2);
      scrollY = maxScroll - 2;
    } else if (scrollY >= maxScroll - 1) {
      window.scrollTo(1, 1);
      scrollY = 1;
    }
    const newProgress = computeScrollProgress(scrollY, maxScroll);
    dispatch(setProgress(newProgress));
  }, [dispatch, globalPathLength, onScrollState]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
} 