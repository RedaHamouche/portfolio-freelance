import { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { createPathDomain } from '@/templating/domains/path';
import { ProgressInitializationService } from './domain/ProgressInitializationService';
import {
  calculateFakeScrollHeight,
  calculateMaxScroll,
  calculateScrollYFromProgress,
} from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';

/**
 * Hook pour gérer l'initialisation du scroll et la synchronisation avec les hash/anchors
 * Priorité : hash > localStorage > default
 * 
 * LOGIQUE SIMPLE:
 * 1. Initialise le progress IMMÉDIATEMENT (hash > localStorage > default)
 * 2. Rend le composant (isScrollSynced = true)
 * 3. Quand le pathLength arrive, fait le window.scrollTo() si nécessaire
 */
export const useScrollInitialization = (globalPathLength: number) => {
  const [isScrollSynced, setIsScrollSynced] = useState(false);
  const hasInitializedProgressRef = useRef(false);
  const hasScrolledRef = useRef(false);
  const initialProgressRef = useRef<number | null>(null); // Stocker le progress initial pour éviter qu'il change
  const dispatch = useDispatch();
  
  // Créer les instances (mémoïsées)
  const pathDomain = useMemo(() => createPathDomain(), []);
  const service = useMemo(() => new ProgressInitializationService(), []);

  // ÉTAPE 1: Initialiser le progress IMMÉDIATEMENT (une seule fois)
  useEffect(() => {
    if (hasInitializedProgressRef.current) return;
    if (typeof window === 'undefined') return; // SSR safety
    
    try {
      const hash = window.location.hash;
      
      // Utiliser le service centralisé pour initialiser le progress
      // Règles: anchorID → progress → localStorage → default
      // La logique est identique sur mobile et desktop
      const result = service.initializeProgress(hash, pathDomain);
      
      // Stocker le progress initial dans une ref pour éviter qu'il change
      initialProgressRef.current = result.progress;
      
      dispatch({ type: 'scroll/setProgress', payload: result.progress });
      hasInitializedProgressRef.current = true;
      setIsScrollSynced(true); // RENDRE LE COMPOSANT IMMÉDIATEMENT
    } catch (error) {
      console.error('[useScrollInitialization] Erreur lors de l\'initialisation du progress:', error);
      // En cas d'erreur, utiliser le default progress
      const defaultProgress = service.getDefaultProgress();
      initialProgressRef.current = defaultProgress;
      dispatch({ type: 'scroll/setProgress', payload: defaultProgress });
      hasInitializedProgressRef.current = true;
      setIsScrollSynced(true);
    }
  }, [dispatch, pathDomain, service]);

  // ÉTAPE 2: Faire le window.scrollTo() quand le pathLength arrive
  useEffect(() => {
    if (!hasInitializedProgressRef.current) return; // Attendre que le progress soit initialisé
    if (hasScrolledRef.current) return; // Ne faire qu'une fois
    if (typeof window === 'undefined') return; // SSR safety
    if (!globalPathLength || globalPathLength <= 2000) return; // Attendre le vrai pathLength
    if (initialProgressRef.current === null) return; // Attendre que le progress initial soit défini
    
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
    const rafId = requestAnimationFrame(() => {
      try {
        // CRITIQUE: Utiliser le progress initial stocké dans la ref, pas currentProgress
        // Cela évite que le scroll se fasse vers un mauvais endroit si le progress a changé
        const progressToUse = initialProgressRef.current!;
        
        const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
        const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
        const scrollY = calculateScrollYFromProgress(progressToUse, maxScroll);
        
        // Valider que scrollY est un nombre valide
        if (isNaN(scrollY) || !isFinite(scrollY)) {
          console.warn(`[useScrollInitialization] scrollY invalide: ${scrollY}, scroll ignoré`);
          hasScrolledRef.current = true; // Marquer comme fait pour éviter les boucles
          return;
        }
        
        window.scrollTo({ top: scrollY, behavior: 'instant' });
        hasScrolledRef.current = true;
      } catch (error) {
        // Gérer les erreurs de window.scrollTo() (mode privé, restrictions navigateur, etc.)
        console.warn('[useScrollInitialization] Erreur lors du scroll initial:', error);
        // Marquer comme fait pour éviter les tentatives répétées
        hasScrolledRef.current = true;
        // Le scroll manuel fonctionnera quand même
      }
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [globalPathLength]);

  return isScrollSynced;
};

