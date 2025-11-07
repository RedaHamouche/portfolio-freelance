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
    
    const hash = window.location.hash;
    const defaultProgress = service.getDefaultProgress();
    
    // Priorité: hash > localStorage > default
    let progress: number;
    
    if (hash && hash.replace('#', '').trim().length > 0) {
      const anchorId = service.extractHash(hash);
      const hashProgress = service.getProgressFromHash(anchorId, pathDomain, isDesktop);
      if (hashProgress !== null) {
        progress = hashProgress;
      } else {
        const storedProgress = service.getProgressFromStorage();
        progress = storedProgress !== null ? storedProgress : defaultProgress;
      }
    } else {
      const storedProgress = service.getProgressFromStorage();
      progress = storedProgress !== null ? storedProgress : defaultProgress;
    }
    
    dispatch({ type: 'scroll/setProgress', payload: progress });
    hasInitializedProgressRef.current = true;
    setIsScrollSynced(true); // RENDRE LE COMPOSANT IMMÉDIATEMENT
  }, [dispatch, pathDomain, isDesktop, service]);

  // ÉTAPE 2: Faire le window.scrollTo() quand le pathLength arrive
  useEffect(() => {
    if (!hasInitializedProgressRef.current) return; // Attendre que le progress soit initialisé
    if (hasScrolledRef.current) return; // Ne faire qu'une fois
    if (!globalPathLength || globalPathLength <= 2000) return; // Attendre le vrai pathLength
    
    // Récupérer le progress actuel depuis Redux (déjà initialisé à l'étape 1)
    // On ne réinitialise PAS le progress, on fait juste le scroll
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
    const scrollY = calculateScrollYFromProgress(currentProgress, maxScroll);
    
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    hasScrolledRef.current = true;
  }, [globalPathLength, currentProgress]);

  return isScrollSynced;
};

