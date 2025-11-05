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

// Facteur d'easing léger (0.12 = très subtil, plus élevé = plus rapide)
const EASING_FACTOR = 0.12;
const MIN_DELTA = 0.0001; // Seuil minimum pour arrêter l'animation

export function useManualScrollSync(
  globalPathLength: number, 
  onScrollState?: (isScrolling: boolean) => void
) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: RootState) => state.modal.isOpen);
  const isInitializedRef = useRef(false);
  const scrollYRef = useRef(0);
  const scrollEndRafIdRef = useRef<number | null>(null);
  const prevProgressRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);
  const lastScrollTimeRef = useRef(performance.now());
  
  // Refs pour l'easing/inertie
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const easingRafIdRef = useRef<number | null>(null);
  const isEasingActiveRef = useRef(false);

  // Fonction d'easing pour interpoler entre current et target progress
  const easingLoop = useCallback(() => {
    if (typeof window === "undefined") return;
    
    // Ne pas animer si une modal est ouverte
    if (isModalOpen) {
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
      return;
    }
    
    const current = currentProgressRef.current;
    const target = targetProgressRef.current;
    
    // Calculer la différence (gérer le wraparound circulaire)
    let delta = target - current;
    if (Math.abs(delta) > 0.5) {
      delta = delta > 0 ? delta - 1 : delta + 1;
    }
    
    // Si la différence est très petite, arrêter l'animation
    if (Math.abs(delta) < MIN_DELTA) {
      currentProgressRef.current = target;
      dispatch(setProgress(target));
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
      return;
    }
    
    // Interpolation linéaire avec easing
    let newProgress = current + delta * EASING_FACTOR;
    // Normaliser entre 0 et 1 (gérer le wraparound avec modulo)
    newProgress = ((newProgress % 1) + 1) % 1;
    currentProgressRef.current = newProgress;
    dispatch(setProgress(newProgress));
    
    // Continuer l'animation
    easingRafIdRef.current = requestAnimationFrame(easingLoop);
  }, [dispatch, isModalOpen]);

  // Démarrer la boucle d'easing si elle n'est pas déjà active
  const startEasingLoop = useCallback(() => {
    if (!isEasingActiveRef.current) {
      isEasingActiveRef.current = true;
      easingRafIdRef.current = requestAnimationFrame(easingLoop);
    }
  }, [easingLoop]);

  // Fonction pour traiter et mettre à jour la cible du scroll
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
    
    // Mettre à jour la cible pour l'easing
    targetProgressRef.current = newProgress;
    
    // Tracker la direction du scroll
    if (prevProgressRef.current !== null) {
      const direction = newProgress > prevProgressRef.current ? 'forward' : 
                       newProgress < prevProgressRef.current ? 'backward' : null;
      if (direction) {
        dispatch(setLastScrollDirection(direction));
      }
    }
    prevProgressRef.current = newProgress;
    
    // Démarrer la boucle d'easing si nécessaire
    startEasingLoop();
    
    // Réinitialiser le flag de mise à jour en attente
    rafIdRef.current = null;
    pendingUpdateRef.current = false;
  }, [globalPathLength, dispatch, isModalOpen, startEasingLoop]);

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
      
      // Initialiser les valeurs de progress pour l'easing
      const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
      const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
      const { normalizedY } = normalizeScrollY(window.scrollY, maxScroll);
      const initialProgress = computeScrollProgress(normalizedY, maxScroll);
      
      currentProgressRef.current = initialProgress;
      targetProgressRef.current = initialProgress;
      
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
      if (easingRafIdRef.current !== null) {
        cancelAnimationFrame(easingRafIdRef.current);
        easingRafIdRef.current = null;
        isEasingActiveRef.current = false;
      }
    };
  }, [handleScroll, processScrollUpdate, globalPathLength]);
} 