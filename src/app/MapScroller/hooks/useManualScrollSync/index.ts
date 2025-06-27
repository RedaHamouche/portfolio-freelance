import { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '@/store/scrollSlice';
import { SCROLL_CONFIG } from '@/config/scroll';

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

export function useManualScrollSync(globalPathLength: number, onScrollState?: (isScrolling: boolean) => void) {
  const dispatch = useDispatch();
  const isInitializedRef = useRef(false);

  const handleScroll = useCallback(() => {
    if (onScrollState) onScrollState(true);
    const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    let scrollY = window.scrollY;
    
    if (scrollY <= 0) {
      window.scrollTo(0, maxScroll - SCROLL_CONFIG.SCROLL_MARGINS.TOP);
      scrollY = maxScroll - SCROLL_CONFIG.SCROLL_MARGINS.TOP;
    } else if (scrollY >= maxScroll - 1) {
      window.scrollTo(1, SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM);
      scrollY = SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM;
    }
    
    const newProgress = computeScrollProgress(scrollY, maxScroll);
    dispatch(setProgress(newProgress));
  }, [dispatch, globalPathLength, onScrollState]);

  useEffect(() => {
    // Éviter l'appel initial si déjà initialisé
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      handleScroll();
    }
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
} 