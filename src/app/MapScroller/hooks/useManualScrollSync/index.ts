import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '@/store/scrollSlice';
import { SCROLL_CONFIG } from '@/config/scroll';
import { useThrottle } from '@uidotdev/usehooks';

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

export function useManualScrollSync(globalPathLength: number, onScrollState?: (isScrolling: boolean) => void) {
  const dispatch = useDispatch();
  const isInitializedRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 32);

  // Handler natif qui met à jour le state scrollY
  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    setScrollY(window.scrollY);
    if (onScrollState) onScrollState(true);
  }, [onScrollState]);

  useEffect(() => {
    // Éviter l'appel initial si déjà initialisé
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setScrollY(typeof window !== 'undefined' ? window.scrollY : 0);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Effet qui dispatch quand la valeur throttlée change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    let y = throttledScrollY;
    if (y <= 0) {
      window.scrollTo(0, maxScroll - SCROLL_CONFIG.SCROLL_MARGINS.TOP);
      y = maxScroll - SCROLL_CONFIG.SCROLL_MARGINS.TOP;
    } else if (y >= maxScroll - 1) {
      window.scrollTo(1, SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM);
      y = SCROLL_CONFIG.SCROLL_MARGINS.BOTTOM;
    }
    const newProgress = computeScrollProgress(y, maxScroll);
    dispatch(setProgress(newProgress));
  }, [throttledScrollY, globalPathLength, dispatch]);
} 