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
  const scrollEndRafIdRef = useRef<number | null>(null);
  const prevProgressRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);
  const lastScrollTimeRef = useRef(performance.now());

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
    
    // Mettre à jour le temps du dernier scroll
    lastScrollTimeRef.current = performance.now();
    
    // Annuler le RAF précédent qui détecte l'arrêt du scroll
    if (scrollEndRafIdRef.current !== null) {
      cancelAnimationFrame(scrollEndRafIdRef.current);
      scrollEndRafIdRef.current = null;
    }
    
    // Fonction récursive pour détecter l'arrêt du scroll avec RAF
    const checkScrollEnd = () => {
      const timeSinceLastScroll = performance.now() - lastScrollTimeRef.current;
      
      // Si plus de 150ms se sont écoulés depuis le dernier scroll, on considère que le scroll est arrêté
      if (timeSinceLastScroll >= 150) {
        if (onScrollState) onScrollState(false);
        scrollEndRafIdRef.current = null;
      } else {
        // Continuer à vérifier au prochain frame
        scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);
      }
    };
    
    // Démarrer la vérification au prochain frame
    scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);
    
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
      if (scrollEndRafIdRef.current !== null) {
        cancelAnimationFrame(scrollEndRafIdRef.current);
        scrollEndRafIdRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll, processScrollUpdate]);
} 