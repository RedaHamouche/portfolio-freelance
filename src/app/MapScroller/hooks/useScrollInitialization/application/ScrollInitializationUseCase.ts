/**
 * Use Case pour l'initialisation du scroll
 * Orchestre la logique de priorité entre hash et scroll initial
 */

import { ScrollInitializationService, type PathDomainLike } from '../domain/ScrollInitializationService';
import {
  calculateFakeScrollHeight,
  calculateMaxScroll,
  calculateScrollYFromProgress,
} from '@/utils/scrollCalculations';

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
        const scrollY = this.calculateScrollY(hashProgress, globalPathLength);
        this.scrollToPosition(scrollY);
        return { progress: hashProgress, source: 'hash', scrollY };
      }
    }

    // 2. Priorité : localStorage (si présent)
    const storedProgress = this.service.getProgressFromStorage();
    if (storedProgress !== null) {
      // Progress sauvegardé trouvé : utiliser le progress du localStorage
      dispatch({ type: 'scroll/setProgress', payload: storedProgress });
      const scrollY = this.calculateScrollY(storedProgress, globalPathLength);
      this.scrollToPosition(scrollY);
      return { progress: storedProgress, source: 'storage', scrollY };
    }

    // 3. Priorité : Début par défaut
    const defaultProgress = this.service.getDefaultProgress();
    dispatch({ type: 'scroll/setProgress', payload: defaultProgress });
    const scrollY = this.calculateScrollY(defaultProgress, globalPathLength);
    this.scrollToPosition(scrollY);
    return { progress: defaultProgress, source: 'default', scrollY };
  }

  /**
   * Détermine si l'initialisation manuelle du scroll doit être ignorée
   * Si un hash est présent, on ignore l'initialisation manuelle pour éviter les conflits
   */
  shouldSkipManualScrollInitialization(hash: string | undefined): boolean {
    return this.service.shouldUseHashProgress(hash);
  }

  /**
   * Calcule la position de scroll Y à partir d'un progress
   */
  private calculateScrollY(progress: number, globalPathLength: number): number {
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    return calculateScrollYFromProgress(progress, maxScroll);
  }

  /**
   * Scroll vers une position
   */
  private scrollToPosition(scrollY: number): void {
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  }
}

