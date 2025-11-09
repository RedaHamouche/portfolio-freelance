/**
 * Hook pour sauvegarder automatiquement le progress dans le localStorage
 * Écoute les changements de progress et les persiste
 */

import { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ProgressPersistenceService } from '@/components/app/MapScroller/hooks/useScrollInitialization/domain/ProgressPersistenceService';

/**
 * Hook pour sauvegarder automatiquement le progress dans le localStorage
 * Écoute les changements de progress et les persiste
 * Utilise ProgressPersistenceService directement pour éviter les dépendances croisées
 */
export const useProgressPersistence = () => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const lastSavedProgressRef = useRef<number | null>(null);

  // Créer le service une seule fois (mémoïsé)
  const persistenceService = useMemo(() => new ProgressPersistenceService(), []);

  useEffect(() => {
    // Ne pas sauvegarder si le progress n'a pas changé
    if (lastSavedProgressRef.current === progress) {
      return;
    }

    // Sauvegarder le progress dans le localStorage
    persistenceService.saveProgress(progress);
    lastSavedProgressRef.current = progress;
  }, [progress, persistenceService]);
};

