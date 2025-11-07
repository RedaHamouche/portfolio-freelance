/**
 * Service de domaine pour l'initialisation du scroll
 * Gère la logique de priorité entre hash, localStorage et scroll initial
 */

import { ProgressPersistenceService } from './ProgressPersistenceService';

export interface PathDomainLike {
  getComponentByAnchorId(anchorId: string, isDesktop: boolean): { position?: { progress?: number } } | undefined;
}

export class ScrollInitializationService {
  private readonly DEFAULT_PROGRESS = 0.005; // 0.5%
  private readonly persistenceService: ProgressPersistenceService;

  constructor(persistenceService?: ProgressPersistenceService) {
    this.persistenceService = persistenceService ?? new ProgressPersistenceService();
  }

  /**
   * Détermine si on doit utiliser le progress du hash
   * Le hash a toujours la priorité sur le scroll initial
   */
  shouldUseHashProgress(hash: string | undefined | null): boolean {
    if (!hash) return false;
    const cleanHash = hash.replace('#', '').trim();
    return cleanHash.length > 0;
  }

  /**
   * Extrait le hash sans le #
   */
  extractHash(hash: string): string {
    return hash.replace('#', '').trim();
  }

  /**
   * Récupère le progress à partir d'un hash
   * Retourne null si le composant n'est pas trouvé ou n'a pas de progress
   * Valide que le progress est dans la plage [0, 1]
   */
  getProgressFromHash(
    anchorId: string,
    pathDomain: PathDomainLike,
    isDesktop: boolean
  ): number | null {
    const component = pathDomain.getComponentByAnchorId(anchorId, isDesktop);
    
    if (!component) {
      return null;
    }

    const progress = component.position?.progress;
    
    if (progress === undefined || progress === null) {
      return null;
    }

    // Valider que le progress est dans la plage valide [0, 1]
    if (progress < 0 || progress > 1 || isNaN(progress)) {
      console.warn(`[ScrollInitializationService] Progress invalide depuis hash "${anchorId}": ${progress}`);
      return null;
    }

    return progress;
  }

  /**
   * Récupère le progress depuis le localStorage
   * Retourne null si aucun progress n'est sauvegardé
   */
  getProgressFromStorage(): number | null {
    return this.persistenceService.getProgress();
  }

  /**
   * Retourne le progress par défaut (0.5%)
   */
  getDefaultProgress(): number {
    return this.DEFAULT_PROGRESS;
  }

  /**
   * Sauvegarde le progress dans le localStorage
   */
  saveProgress(progress: number): void {
    this.persistenceService.saveProgress(progress);
  }
}

