import { useCallback } from 'react';
import { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import type { ScrollContextType } from '@/contexts/ScrollContext';

/**
 * Interface pour les refs nécessaires à useScrollInitialization
 */
export interface UseScrollInitializationRefs {
  isInitializedRef: { current: boolean };
  lastInitializedPathLengthRef: { current: number };
}

/**
 * Hook pour gérer l'initialisation du useCase
 * Centralise la logique d'initialisation et de réinitialisation
 */
export function useScrollInitialization(
  scrollContext: ScrollContextType,
  refs: UseScrollInitializationRefs,
  getUseCase: () => ManualScrollSyncUseCase
) {
  // Fonction centralisée pour initialiser le useCase
  const initializeUseCase = useCallback(
    (pathLength: number, progress?: number) => {
      try {
        getUseCase().initialize(pathLength, progress);
        refs.lastInitializedPathLengthRef.current = pathLength;
        refs.isInitializedRef.current = true;
      } catch (error) {
        console.error('[useManualScrollSync] Erreur lors de l\'initialisation:', error);
        // Recréer le useCase en cas d'erreur
        const newUseCase = new ManualScrollSyncUseCase(
          scrollContext.easingService,
          scrollContext.progressCalculator,
          scrollContext.stateDetector,
          scrollContext.velocityService,
          scrollContext.velocityConfig
        );
        newUseCase.initialize(pathLength, progress);
        refs.lastInitializedPathLengthRef.current = pathLength;
        refs.isInitializedRef.current = true;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getUseCase,
      scrollContext.easingService,
      scrollContext.progressCalculator,
      scrollContext.stateDetector,
      scrollContext.velocityService,
      scrollContext.velocityConfig,
      // refs sont stables, pas besoin de les inclure dans les dépendances
    ]
  );

  return {
    initializeUseCase,
  };
}

