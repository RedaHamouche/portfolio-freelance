import { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { createPathDomain } from '@/templating/domains/path';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { ScrollInitializationService } from './domain/ScrollInitializationService';
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
  const isDesktop = useBreakpoint('>=desktop');
  
  // Créer les instances (mémoïsées)
  const pathDomain = useMemo(() => createPathDomain(), []);
  const service = useMemo(() => new ScrollInitializationService(), []);

  // ÉTAPE 1: Initialiser le progress IMMÉDIATEMENT (une seule fois)
  useEffect(() => {
    if (hasInitializedProgressRef.current) return;
    if (typeof window === 'undefined') return; // SSR safety
    
    try {
      const hash = window.location.hash;
      const defaultProgress = service.getDefaultProgress();
      
      // Priorité: hash > localStorage > default
      let progress: number;
      
      // CRITIQUE: Si le hash est présent mais invalide, utiliser localStorage au lieu de default
      // Cela permet de restaurer la position même si l'URL a un hash invalide
      if (hash && hash.replace('#', '').trim().length > 0) {
        const anchorId = service.extractHash(hash);
        const hashProgress = service.getProgressFromHash(anchorId, pathDomain, isDesktop);
        if (hashProgress !== null) {
          // Valider le progress du hash (doit être dans [0, 1])
          if (hashProgress >= 0 && hashProgress <= 1) {
            progress = hashProgress;
          } else {
            // Hash invalide : utiliser localStorage si disponible, sinon default
            console.warn(`[useScrollInitialization] Progress invalide depuis hash "${anchorId}": ${hashProgress}, utilisation du fallback`);
            const storedProgress = service.getProgressFromStorage();
            progress = storedProgress !== null ? storedProgress : defaultProgress;
          }
        } else {
          // Hash non trouvé : utiliser localStorage si disponible, sinon default
          const storedProgress = service.getProgressFromStorage();
          progress = storedProgress !== null ? storedProgress : defaultProgress;
        }
      } else {
        // Pas de hash : utiliser localStorage si disponible, sinon default
        const storedProgress = service.getProgressFromStorage();
        progress = storedProgress !== null ? storedProgress : defaultProgress;
      }
      
      // Validation finale du progress (sécurité supplémentaire)
      if (progress < 0 || progress > 1 || isNaN(progress)) {
        console.warn(`[useScrollInitialization] Progress invalide: ${progress}, utilisation du default`);
        progress = defaultProgress;
      }
      
      // Stocker le progress initial dans une ref pour éviter qu'il change
      initialProgressRef.current = progress;
      
      dispatch({ type: 'scroll/setProgress', payload: progress });
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
  }, [dispatch, pathDomain, isDesktop, service]);

  // ÉTAPE 2: Faire le window.scrollTo() quand le pathLength arrive
  useEffect(() => {
    if (!hasInitializedProgressRef.current) return; // Attendre que le progress soit initialisé
    if (hasScrolledRef.current) return; // Ne faire qu'une fois
    if (typeof window === 'undefined') return; // SSR safety
    if (!globalPathLength || globalPathLength <= 2000) return; // Attendre le vrai pathLength
    if (initialProgressRef.current === null) return; // Attendre que le progress initial soit défini
    
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
    const rafId = requestAnimationFrame(() => {
      // Double RAF pour garantir que le layout est complètement calculé
      requestAnimationFrame(() => {
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
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [globalPathLength]);

  return isScrollSynced;
};

