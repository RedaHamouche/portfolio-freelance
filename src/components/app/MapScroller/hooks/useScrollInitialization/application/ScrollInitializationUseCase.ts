/**
 * Use Case pour l'initialisation du scroll
 * Orchestre la logique de priorité entre hash et scroll initial
 */

import { ScrollInitializationService, type PathDomainLike } from '../domain/ScrollInitializationService';
import { calculateScrollY } from '@/utils/scrollUtils/calculateScrollY';
import { syncScrollPosition } from '@/utils/scrollUtils/syncScrollPosition';

export interface ScrollInitializationResult {
  progress: number;
  source: 'hash' | 'storage' | 'default';
  scrollY: number;
}

export type DispatchFunction = (action: { type: string; payload: number }) => void;

export class ScrollInitializationUseCase {
  constructor(private service: ScrollInitializationService) {}

  /**
   * Initialise le progress en respectant la priorité : hash > localStorage > default
   * 1. Hash (si présent) - priorité la plus haute
   * 2. localStorage (si présent) - priorité moyenne
   * 3. Début par défaut - priorité la plus basse
   */
  initializeProgress(
    hash: string | undefined,
    globalPathLength: number,
    pathDomain: PathDomainLike,
    isDesktop: boolean,
    dispatch: DispatchFunction
  ): ScrollInitializationResult {
    // 1. Priorité : Hash (si présent)
    const shouldUseHash = this.service.shouldUseHashProgress(hash);

    if (shouldUseHash) {
      const anchorId = this.service.extractHash(hash!);
      const hashProgress = this.service.getProgressFromHash(anchorId, pathDomain, isDesktop);

      if (hashProgress !== null) {
        // Hash trouvé : utiliser le progress du hash (priorité la plus haute)
        dispatch({ type: 'scroll/setProgress', payload: hashProgress });
        const scrollY = calculateScrollY(hashProgress, globalPathLength);
        syncScrollPosition(hashProgress, globalPathLength, false, { behavior: 'instant' });
        return { progress: hashProgress, source: 'hash', scrollY };
      }
    }

    // 2. Priorité : localStorage (si présent)
    const storedProgress = this.service.getProgressFromStorage();
    if (storedProgress !== null) {
      // Progress sauvegardé trouvé : utiliser le progress du localStorage
      dispatch({ type: 'scroll/setProgress', payload: storedProgress });
      const scrollY = calculateScrollY(storedProgress, globalPathLength);
      syncScrollPosition(storedProgress, globalPathLength, false, { behavior: 'instant' });
      return { progress: storedProgress, source: 'storage', scrollY };
    }

    // 3. Priorité : Début par défaut
    const defaultProgress = this.service.getDefaultProgress();
    dispatch({ type: 'scroll/setProgress', payload: defaultProgress });
    const scrollY = calculateScrollY(defaultProgress, globalPathLength);
    syncScrollPosition(defaultProgress, globalPathLength, false, { behavior: 'instant' });
    return { progress: defaultProgress, source: 'default', scrollY };
  }

  /**
   * Détermine si l'initialisation manuelle du scroll doit être ignorée
   * Si un hash est présent, on ignore l'initialisation manuelle pour éviter les conflits
   */
  shouldSkipManualScrollInitialization(hash: string | undefined): boolean {
    return this.service.shouldUseHashProgress(hash);
  }
}

