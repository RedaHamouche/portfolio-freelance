import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setProgress, setLastScrollDirection } from '@/store/scrollSlice';
import {
  computeScrollProgress,
  calculateFakeScrollHeight,
  calculateMaxScroll,
  normalizeScrollY,
} from '@/utils/scrollCalculations';

export function useManualScrollSync(globalPathLength: number, onScrollState?: (isScrolling: boolean) => void) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: RootState) => state.modal.isOpen);
  const isInitializedRef = useRef(false);
  const scrollYRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevProgressRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);

  // Fonction pour traiter et dispatcher les mises à jour de scroll
  const processScrollUpdate = useCallback(() => {
    if (typeof window === "undefined") return;
    
    // Ne pas mettre à jour le progress si une modal est ouverte
    if (isModalOpen) {
      rafIdRef.current = null;
      pendingUpdateRef.current = false;
      return;
    }
    
    const currentScrollY = scrollYRef.current;
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    
    const { normalizedY, shouldCorrect, correctionY } = normalizeScrollY(currentScrollY, maxScroll);
    
    if (shouldCorrect && correctionY !== undefined) {
      window.scrollTo(0, correctionY);
    }
    
    const newProgress = computeScrollProgress(normalizedY, maxScroll);
    
    // Tracker la direction du scroll
    if (prevProgressRef.current !== null) {
      const direction = newProgress > prevProgressRef.current ? 'forward' : 
                       newProgress < prevProgressRef.current ? 'backward' : null;
      if (direction) {
        dispatch(setLastScrollDirection(direction));
      }
    }
    prevProgressRef.current = newProgress;
    
    dispatch(setProgress(newProgress));
    
    // Réinitialiser le flag de mise à jour en attente
    rafIdRef.current = null;
    pendingUpdateRef.current = false;
  }, [globalPathLength, dispatch, isModalOpen]);

  // Handler natif qui met à jour le scrollY et programme une mise à jour via RAF
  const handleScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    
    // Ignorer les événements de scroll si une modal est ouverte
    if (isModalOpen) {
      return;
    }
    
    // Mettre à jour la valeur de scroll immédiatement
    scrollYRef.current = window.scrollY;
    
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
    
    // Programmer une mise à jour via RAF si aucune n'est déjà en cours
    // Cela regroupe les mises à jour et synchronise avec le cycle de rendu du navigateur
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => {
        processScrollUpdate();
      });
    }
  }, [onScrollState, isModalOpen, processScrollUpdate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Éviter l'appel initial si déjà initialisé
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      scrollYRef.current = window.scrollY;
      // Traiter la position initiale
      processScrollUpdate();
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll, processScrollUpdate]);
} 