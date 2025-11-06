/**
 * Hook pour sauvegarder automatiquement le progress dans le localStorage
 * Écoute les changements de progress et les persiste
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ScrollInitializationService } from '../useScrollInitialization/domain/ScrollInitializationService';

export const useProgressPersistence = () => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const serviceRef = useRef<ScrollInitializationService | null>(null);
  const lastSavedProgressRef = useRef<number | null>(null);

  // Créer le service une seule fois
  if (!serviceRef.current) {
    serviceRef.current = new ScrollInitializationService();
  }

  useEffect(() => {
    // Ne pas sauvegarder si le progress n'a pas changé
    if (lastSavedProgressRef.current === progress) {
      return;
    }

    // Sauvegarder le progress dans le localStorage
    serviceRef.current!.saveProgress(progress);
    lastSavedProgressRef.current = progress;
  }, [progress]);
};

