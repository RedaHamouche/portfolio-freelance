import { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
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
  const dispatch = useDispatch();
  const currentProgress = useSelector((state: RootState) => state.scroll.progress);
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
      
      if (hash && hash.replace('#', '').trim().length > 0) {
        const anchorId = service.extractHash(hash);
        const hashProgress = service.getProgressFromHash(anchorId, pathDomain, isDesktop);
        if (hashProgress !== null) {
          // Valider le progress du hash (doit être dans [0, 1])
          if (hashProgress >= 0 && hashProgress <= 1) {
            progress = hashProgress;
          } else {
            console.warn(`[useScrollInitialization] Progress invalide depuis hash "${anchorId}": ${hashProgress}, utilisation du fallback`);
            const storedProgress = service.getProgressFromStorage();
            progress = storedProgress !== null ? storedProgress : defaultProgress;
          }
        } else {
          const storedProgress = service.getProgressFromStorage();
          progress = storedProgress !== null ? storedProgress : defaultProgress;
        }
      } else {
        const storedProgress = service.getProgressFromStorage();
        progress = storedProgress !== null ? storedProgress : defaultProgress;
      }
      
      // Validation finale du progress (sécurité supplémentaire)
      if (progress < 0 || progress > 1 || isNaN(progress)) {
        console.warn(`[useScrollInitialization] Progress invalide: ${progress}, utilisation du default`);
        progress = defaultProgress;
      }
      
      dispatch({ type: 'scroll/setProgress', payload: progress });
      hasInitializedProgressRef.current = true;
      setIsScrollSynced(true); // RENDRE LE COMPOSANT IMMÉDIATEMENT
    } catch (error) {
      console.error('[useScrollInitialization] Erreur lors de l\'initialisation du progress:', error);
      // En cas d'erreur, utiliser le default progress
      const defaultProgress = service.getDefaultProgress();
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
    
    try {
      // Récupérer le progress actuel depuis Redux (déjà initialisé à l'étape 1)
      // On ne réinitialise PAS le progress, on fait juste le scroll
      const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
      const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
      const scrollY = calculateScrollYFromProgress(currentProgress, maxScroll);
      
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
  }, [globalPathLength, currentProgress]);

  return isScrollSynced;
};

