import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '@/store/scrollSlice';
import { useThrottle } from '@uidotdev/usehooks';
import {
  computeScrollProgress,
  calculateFakeScrollHeight,
  calculateMaxScroll,
  normalizeScrollY,
} from '@/utils/scrollCalculations';

export function useManualScrollSync(globalPathLength: number, onScrollState?: (isScrolling: boolean) => void) {
  const dispatch = useDispatch();
  const isInitializedRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 32);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handler natif qui met à jour le state scrollY
  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    setScrollY(window.scrollY);
    
    // Indiquer que le scroll est en cours
    if (onScrollState) onScrollState(true);
    
    // Nettoyer le timeout précédent
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Créer un nouveau timeout pour détecter l'arrêt du scroll
    scrollTimeoutRef.current = setTimeout(() => {
      if (onScrollState) onScrollState(false);
    }, 150); // 150ms après le dernier événement de scroll
  }, [onScrollState]);

  useEffect(() => {
    // Éviter l'appel initial si déjà initialisé
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setScrollY(typeof window !== 'undefined' ? window.scrollY : 0);
    }
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Effet qui dispatch quand la valeur throttlée change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    
    const { normalizedY, shouldCorrect, correctionY } = normalizeScrollY(throttledScrollY, maxScroll);
    
    if (shouldCorrect && correctionY !== undefined) {
      window.scrollTo(0, correctionY);
    }
    
    const newProgress = computeScrollProgress(normalizedY, maxScroll);
    dispatch(setProgress(newProgress));
  }, [throttledScrollY, globalPathLength, dispatch]);
} 