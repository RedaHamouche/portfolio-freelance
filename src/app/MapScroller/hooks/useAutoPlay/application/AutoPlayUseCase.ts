import { AutoPlayProgressService } from '../domain/AutoPlayProgressService';
import { AutoPlayPauseService } from '../domain/AutoPlayPauseService';
import { AutoPlayAnchorDetector } from '../domain/AutoPlayAnchorDetector';
import { SCROLL_CONFIG } from '@/config';

export interface AutoPlayAnimateParams {
  isAutoPlaying: boolean;
  currentProgress: number;
  direction: 1 | -1;
  dt: number;
  isDesktop: boolean;
  isPaused: boolean;
  lastPausedAnchorId?: string | null;
}

export interface AutoPlayAnimateResult {
  newProgress: number;
  shouldPause: boolean;
  pauseDuration?: number;
  anchorId?: string;
}

/**
 * Use case pour gérer l'autoplay
 * Orchestre les services de domaine pour calculer le progress, détecter les anchors et gérer les pauses
 */
export class AutoPlayUseCase {
  constructor(
    private readonly progressService: AutoPlayProgressService,
    private readonly pauseService: AutoPlayPauseService,
    private readonly anchorDetector: AutoPlayAnchorDetector
  ) {}

  /**
   * Calcule le prochain progress et détecte les anchors pour la pause
   * @param params Paramètres d'animation
   * @returns Résultat avec nouveau progress et informations de pause, ou null si pas d'animation
   */
  animate(params: AutoPlayAnimateParams): AutoPlayAnimateResult | null {
    // Ne pas animer si autoplay désactivé ou en pause
    if (!params.isAutoPlaying || params.isPaused) {
      return null;
    }

    // Calculer le nouveau progress avec la vitesse appropriée selon le device
    const newProgress = this.progressService.calculateNextProgress(
      params.currentProgress,
      params.direction,
      params.dt,
      params.isDesktop
    );

    // Détecter un anchor entre l'ancien et le nouveau progress
    const anchor = this.anchorDetector.detectAnchor(
      params.currentProgress,
      newProgress,
      params.isDesktop
    );

    // Vérifier si on doit faire une pause
    const shouldPause =
      anchor &&
      anchor.anchorId &&
      anchor.anchorId !== params.lastPausedAnchorId &&
      this.pauseService.shouldPause(anchor);

    return {
      newProgress,
      shouldPause: shouldPause || false,
      pauseDuration: shouldPause ? this.pauseService.getPauseDuration(anchor!) : undefined,
      anchorId: anchor?.anchorId,
    };
  }

  /**
   * @deprecated Cette méthode n'est plus utilisée dans le code principal.
   * Le système de cooldown de 5 secondes remplace le bump.
   * Conservée uniquement pour les tests.
   * 
   * Calcule le progress après un bump pour sortir de la zone d'anchor
   * @param currentProgress Progress actuel
   * @param direction Direction du scroll (1 = forward, -1 = backward)
   * @returns Nouveau progress avec bump
   */
  calculateBumpProgress(currentProgress: number, direction: 1 | -1): number {
    const bump = SCROLL_CONFIG.ANCHOR_BUMP * direction;
    return ((currentProgress + bump + 1) % 1);
  }
}

