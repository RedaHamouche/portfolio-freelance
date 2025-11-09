import { SCROLL_CONFIG } from '@/config';
import type { PathDomainAPI } from '@/templating/domains/path/api';
import type { PathComponent } from '@/templating/domains/path/types';

/**
 * Service de domaine pour détecter les anchors lors de l'autoplay
 * Utilise le PathDomain pour trouver les anchors sur le path
 */
export class AutoPlayAnchorDetector {
  constructor(private readonly pathDomain: PathDomainAPI) {}

  /**
   * Détecte un anchor entre deux progress
   * @param fromProgress Progress de départ
   * @param toProgress Progress d'arrivée
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   * @returns L'anchor détecté ou null
   */
  detectAnchor(
    fromProgress: number,
    toProgress: number,
    isDesktop: boolean
  ): PathComponent | null {
    return this.pathDomain.getNextAnchor(
      fromProgress,
      toProgress,
      SCROLL_CONFIG.ANCHOR_TOLERANCE,
      isDesktop
    );
  }
}

