/**
 * Hook pour utiliser le progress initial pré-calculé côté serveur
 * Évite les calculs côté client et améliore le FCP
 * 
 * Vérifie aussi le hash et localStorage côté client pour ajuster si nécessaire
 * (le hash n'est pas accessible côté serveur dans Next.js App Router)
 */

import { useEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import type { InitialProgressResult } from '@/utils/ssr/calculateInitialProgress';
import { syncScrollPosition } from '@/utils/scrollUtils/syncScrollPosition';
import { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';
import { ProgressInitializationService } from './domain/ProgressInitializationService';
import { useTemplatingContext } from '@/contexts/TemplatingContext';
import { isValidPathLength } from '@/utils/validation/isValidPathLength';
import { isBrowser } from '@/utils/ssr/isBrowser';

/**
 * Utilise le progress initial pré-calculé côté serveur
 * Vérifie le hash et localStorage côté client pour ajuster si nécessaire
 * Applique le progress et fait le scrollTo() quand le pathLength est disponible
 */
export function useScrollInitializationWithPreloadedProgress(
  initialProgress: InitialProgressResult
) {
  const dispatch = useDispatch();
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const hasAppliedProgressRef = useRef(false);
  const hasScrolledRef = useRef(false);
  const progressUpdateServiceRef = useRef<ProgressUpdateService | null>(null);
  const { pathDomain } = useTemplatingContext();

  // Créer les services une seule fois
  if (!progressUpdateServiceRef.current) {
    progressUpdateServiceRef.current = new ProgressUpdateService(dispatch);
  }

  const initializationService = useMemo(
    () => new ProgressInitializationService(),
    []
  );

  // ÉTAPE 1: Déterminer le progress final (hash > localStorage > pré-calculé)
  const finalProgress = useMemo(() => {
    if (!isBrowser()) return initialProgress.progress;

    // Vérifier le hash côté client (priorité la plus haute)
    const hash = window.location.hash;
    if (hash) {
      const hashResult = initializationService.initializeProgress(hash, pathDomain);
      // Si le hash donne un progress différent du pré-calculé, utiliser le hash
      if (hashResult.source === 'hash' && hashResult.progress !== initialProgress.progress) {
        return hashResult.progress;
      }
    }

    // Vérifier localStorage (priorité moyenne)
    const storedProgress = initializationService.getProgressFromStorage();
    if (storedProgress !== null && storedProgress !== initialProgress.progress) {
      return storedProgress;
    }

    // Utiliser le progress pré-calculé côté serveur (fallback)
    return initialProgress.progress;
  }, [initialProgress.progress, initializationService, pathDomain]);

  // ÉTAPE 2: Appliquer le progress final immédiatement (une seule fois)
  useEffect(() => {
    if (hasAppliedProgressRef.current) return;
    if (!isBrowser()) return;
    if (!progressUpdateServiceRef.current) return;

    try {
      // Utiliser le progress final (hash/localStorage/pré-calculé)
      progressUpdateServiceRef.current.updateProgressOnly(finalProgress);
      hasAppliedProgressRef.current = true;
    } catch (error) {
      console.error(
        '[useScrollInitializationWithPreloadedProgress] Erreur lors de l\'application du progress:',
        error
      );
      // En cas d'erreur, utiliser le default progress
      if (progressUpdateServiceRef.current) {
        const defaultProgress = 0.005;
        progressUpdateServiceRef.current.updateProgressOnly(defaultProgress);
        hasAppliedProgressRef.current = true;
      }
    }
  }, [finalProgress]);

  // ÉTAPE 3: Faire le window.scrollTo() quand le pathLength arrive
  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (!isBrowser()) return;
    if (!isValidPathLength(globalPathLength)) return;

    try {
      // Faire le scrollTo() pour positionner le scroll
      syncScrollPosition(finalProgress, globalPathLength, false, {
        behavior: 'instant',
      });

      hasScrolledRef.current = true;
    } catch (error) {
      console.error(
        '[useScrollInitializationWithPreloadedProgress] Erreur lors du scrollTo:',
        error
      );
    }
  }, [globalPathLength, finalProgress]);
}

