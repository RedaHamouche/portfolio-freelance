import { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { createPathDomain } from '@/templating/domains/path';
import { ProgressInitializationService } from './domain/ProgressInitializationService';
import { isBrowser } from '@/utils/ssr/isBrowser';
import { isValidPathLength } from '@/utils/validation/isValidPathLength';
import { syncScrollPosition } from '@/utils/scrollUtils/syncScrollPosition';
import { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';

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
  const progressUpdateService = useMemo(() => new ProgressUpdateService(dispatch), [dispatch]);

  // ÉTAPE 1: Initialiser le progress IMMÉDIATEMENT (une seule fois)
  useEffect(() => {
    if (hasInitializedProgressRef.current) return;
    if (!isBrowser()) return; // SSR safety
    
    try {
      const hash = window.location.hash;
      
      // Utiliser le service centralisé pour initialiser le progress
      // Règles: anchorID → progress → localStorage → default
      // La logique est identique sur mobile et desktop
      const result = service.initializeProgress(hash, pathDomain);
      
      // Stocker le progress initial dans une ref pour éviter qu'il change
      initialProgressRef.current = result.progress;
      
      // Utiliser le service centralisé pour mettre à jour le progress (source unique de vérité)
      progressUpdateService.updateProgressOnly(result.progress);
      hasInitializedProgressRef.current = true;
      setIsScrollSynced(true); // RENDRE LE COMPOSANT IMMÉDIATEMENT
    } catch (error) {
      console.error('[useScrollInitialization] Erreur lors de l\'initialisation du progress:', error);
      // En cas d'erreur, utiliser le default progress
      const defaultProgress = service.getDefaultProgress();
      initialProgressRef.current = defaultProgress;
      progressUpdateService.updateProgressOnly(defaultProgress);
      hasInitializedProgressRef.current = true;
      setIsScrollSynced(true);
    }
  }, [pathDomain, service, progressUpdateService]);

  // ÉTAPE 2: Faire le window.scrollTo() quand le pathLength arrive
  useEffect(() => {
    if (!hasInitializedProgressRef.current) return; // Attendre que le progress soit initialisé
    if (hasScrolledRef.current) return; // Ne faire qu'une fois
    if (!isBrowser()) return; // SSR safety
    if (!isValidPathLength(globalPathLength)) return; // Attendre le vrai pathLength
    if (initialProgressRef.current === null) return; // Attendre que le progress initial soit défini
    
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
    const rafId = requestAnimationFrame(() => {
      // CRITIQUE: Utiliser le progress initial stocké dans la ref, pas currentProgress
      // Cela évite que le scroll se fasse vers un mauvais endroit si le progress a changé
      const progressToUse = initialProgressRef.current!;
      
      // Utiliser l'utilitaire centralisé pour synchroniser le scroll (source unique de vérité)
      const success = syncScrollPosition(progressToUse, globalPathLength, false, {
        behavior: 'instant',
        logPrefix: '[useScrollInitialization]',
      });
      
      if (success) {
        hasScrolledRef.current = true;
      } else {
        // Marquer comme fait même en cas d'échec pour éviter les tentatives répétées
        hasScrolledRef.current = true;
      }
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [globalPathLength]);

  return isScrollSynced;
};

