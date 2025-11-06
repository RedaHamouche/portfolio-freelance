import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { createPathDomain } from '@/templating/domains/path';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { ScrollInitializationService } from './domain/ScrollInitializationService';
import { ScrollInitializationUseCase } from './application/ScrollInitializationUseCase';

/**
 * Hook pour gérer l'initialisation du scroll et la synchronisation avec les hash/anchors
 * Utilise une architecture DDD avec un service de domaine et un use case
 * Priorité : hash > localStorage > default
 */
export const useScrollInitialization = (globalPathLength: number) => {
  const [isScrollSynced, setIsScrollSynced] = useState(false);
  const dispatch = useDispatch();
  const isDesktop = useBreakpoint('>=desktop');
  
  // Créer les instances (mémoïsées)
  const pathDomain = useMemo(() => createPathDomain(), []);
  const service = useMemo(() => new ScrollInitializationService(), []);
  const useCase = useMemo(() => new ScrollInitializationUseCase(service), [service]);

  useEffect(() => {
    // On attend que la longueur du path soit connue
    if (!globalPathLength) return;

    const hash = window.location.hash;
    
    // Utiliser le use case pour initialiser le progress (priorité: hash > localStorage > default)
    const result = useCase.initializeProgress(
      hash,
      globalPathLength,
      pathDomain,
      isDesktop,
      dispatch
    );

    // Log un warning si le hash n'a pas pu être résolu
    if (result.source === 'default' && hash && hash.replace('#', '').trim().length > 0) {
      console.warn(`[useScrollInitialization] Composant avec anchorId "${service.extractHash(hash)}" non trouvé (isDesktop: ${isDesktop})`);
    }
    
    setIsScrollSynced(true);
  }, [globalPathLength, dispatch, pathDomain, isDesktop, useCase, service]);

  return isScrollSynced;
};

