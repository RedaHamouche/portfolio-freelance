/**
 * Service de domaine centralisé pour l'initialisation du progress
 * 
 * RÈGLES D'INITIALISATION (priorité décroissante) :
 * 1. Hash (anchorID) → progress du composant
 * 2. localStorage → progress sauvegardé
 * 3. Default → progress par défaut (0.005)
 * 
 * Ce service centralise TOUTE la logique d'initialisation pour éviter la duplication
 * et garantir la cohérence dans toute l'application.
 */

import { ProgressPersistenceService } from './ProgressPersistenceService';

export interface PathDomainLike {
  getComponentByAnchorId(anchorId: string, isDesktop: boolean): { position?: { progress?: number } } | undefined;
  getAllComponents(isDesktop: boolean): Array<{ anchorId?: string; position?: { progress?: number } }>;
}

export interface ProgressInitializationResult {
  progress: number;
  source: 'hash' | 'storage' | 'default';
  anchorId?: string | null;
}

export class ProgressInitializationService {
  private readonly DEFAULT_PROGRESS = 0.005; // 0.5%
  private readonly persistenceService: ProgressPersistenceService;

  constructor(persistenceService?: ProgressPersistenceService) {
    this.persistenceService = persistenceService ?? new ProgressPersistenceService();
  }

  /**
   * Initialise le progress selon les règles de priorité
   * 
   * RÈGLES (identiques sur mobile et desktop) :
   * 1. Hash (anchorID) → progress du composant (cherche d'abord dans desktop, puis mobile)
   * 2. localStorage → progress sauvegardé
   * 3. Default → progress par défaut
   * 
   * @param hash Hash de l'URL (ex: "#projectsBanner")
   * @param pathDomain Domaine pour récupérer les composants
   * @returns Résultat avec le progress et sa source
   */
  initializeProgress(
    hash: string | undefined | null,
    pathDomain: PathDomainLike
  ): ProgressInitializationResult {
    // RÈGLE 1: Hash (anchorID) → progress
    if (this.hasValidHash(hash)) {
      const anchorId = this.extractAnchorId(hash!);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ProgressInitializationService] Hash détecté: "${hash}", anchorID: "${anchorId}"`);
      }
      
      // CRITIQUE: Pour l'initialisation, utiliser TOUJOURS la config desktop comme référence
      // Cela garantit que le même hash donne toujours le même progress, peu importe le breakpoint
      // La logique d'initialisation doit être identique sur mobile et desktop
      let hashProgress = this.getProgressFromAnchorId(anchorId, pathDomain, true); // Toujours desktop
      
      // Si non trouvé dans desktop, chercher dans mobile (fallback)
      if (hashProgress === null) {
        hashProgress = this.getProgressFromAnchorId(anchorId, pathDomain, false);
      }
      
      if (hashProgress !== null) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[ProgressInitializationService] Utilisation du progress du hash: ${hashProgress}`);
        }
        return {
          progress: hashProgress,
          source: 'hash',
          anchorId,
        };
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[ProgressInitializationService] Hash présent mais progress non trouvé dans aucune config, fallback sur localStorage/default`);
        }
      }
    }

    // RÈGLE 2: localStorage → progress sauvegardé
    const storedProgress = this.persistenceService.getProgress();
    if (storedProgress !== null) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ProgressInitializationService] Utilisation du progress du localStorage: ${storedProgress}`);
      }
      return {
        progress: storedProgress,
        source: 'storage',
      };
    }

    // RÈGLE 3: Default → progress par défaut
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ProgressInitializationService] Utilisation du progress par défaut: ${this.DEFAULT_PROGRESS}`);
    }
    return {
      progress: this.DEFAULT_PROGRESS,
      source: 'default',
    };
  }

  /**
   * Vérifie si le hash est valide (non vide après nettoyage)
   */
  hasValidHash(hash: string | undefined | null): boolean {
    if (!hash) return false;
    const cleanHash = hash.replace('#', '').trim();
    return cleanHash.length > 0;
  }

  /**
   * Extrait l'anchorID du hash (sans le #)
   */
  extractAnchorId(hash: string): string {
    return hash.replace('#', '').trim();
  }

  /**
   * Récupère le progress depuis un anchorID
   * 
   * @param anchorId ID du composant anchor
   * @param pathDomain Domaine pour récupérer le composant
   * @param isDesktop Si on est sur desktop ou mobile
   * @returns Progress du composant ou null si non trouvé/invalide
   */
  getProgressFromAnchorId(
    anchorId: string,
    pathDomain: PathDomainLike,
    isDesktop: boolean
  ): number | null {
    const component = pathDomain.getComponentByAnchorId(anchorId, isDesktop);
    
    if (!component) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ProgressInitializationService] Composant non trouvé pour anchorID "${anchorId}" (isDesktop: ${isDesktop})`);
      }
      return null;
    }

    const progress = component.position?.progress;
    
    if (progress === undefined || progress === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[ProgressInitializationService] Composant "${anchorId}" trouvé mais pas de progress dans position:`, component.position);
      }
      return null;
    }

    // Valider que le progress est dans la plage valide [0, 1]
    if (!this.isValidProgress(progress)) {
      console.warn(`[ProgressInitializationService] Progress invalide depuis anchorID "${anchorId}": ${progress}`);
      return null;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ProgressInitializationService] Progress trouvé pour anchorID "${anchorId}": ${progress}`);
    }

    return progress;
  }

  /**
   * Valide qu'un progress est dans la plage valide [0, 1]
   */
  isValidProgress(progress: number): boolean {
    return !isNaN(progress) && progress >= 0 && progress <= 1;
  }

  /**
   * Retourne le progress par défaut
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

  /**
   * Récupère le progress depuis le localStorage
   */
  getProgressFromStorage(): number | null {
    return this.persistenceService.getProgress();
  }
}

