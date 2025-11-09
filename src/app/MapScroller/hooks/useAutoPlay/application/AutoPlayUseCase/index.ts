import { AutoPlayProgressService } from '../../domain/AutoPlayProgressService';
import { AutoPlayPauseService } from '../../domain/AutoPlayPauseService';
import { AutoPlayAnchorDetector } from '../../domain/AutoPlayAnchorDetector';
import { AutoPlayEasingService } from '../../domain/AutoPlayEasingService';
import { SCROLL_CONFIG, AUTO_SCROLL_CONFIG } from '@/config';

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
    private readonly anchorDetector: AutoPlayAnchorDetector,
    private readonly easingService: AutoPlayEasingService
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

    // Calculer le multiplicateur de vitesse avec easing (ralentissement à l'approche, accélération après)
    let speedMultiplier = 1;
    if (AUTO_SCROLL_CONFIG.easing.enabled) {
      speedMultiplier = this.easingService.calculateSpeedMultiplier(
        params.currentProgress,
        params.direction,
        params.isDesktop,
        {
          approachDistance: AUTO_SCROLL_CONFIG.easing.approachDistance,
          minSpeed: AUTO_SCROLL_CONFIG.easing.minSpeed,
          accelerationDistance: AUTO_SCROLL_CONFIG.easing.accelerationDistance,
          maxSpeed: AUTO_SCROLL_CONFIG.easing.maxSpeed,
        }
      );
    }

    // Calculer le nouveau progress avec la vitesse appropriée selon le device et l'easing
    const newProgress = this.progressService.calculateNextProgress(
      params.currentProgress,
      params.direction,
      params.dt,
      params.isDesktop,
      speedMultiplier
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

