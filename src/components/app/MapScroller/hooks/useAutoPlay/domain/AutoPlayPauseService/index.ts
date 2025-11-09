/**
 * Interface pour un anchor avec autoScrollPauseTime optionnel
 */
export interface AnchorWithPauseTime {
  anchorId?: string;
  autoScrollPauseTime?: number;
}

/**
 * Service de domaine pour gérer les pauses lors de l'autoplay
 * Gère la logique de pause avec autoScrollPauseTime (1s par défaut)
 */
export class AutoPlayPauseService {
  private readonly DEFAULT_PAUSE_TIME = 1000; // 1 seconde par défaut

  /**
   * Détermine si on doit faire une pause sur cet anchor
   * Si autoScrollPauseTime n'est pas défini, on fait une pause avec la durée par défaut (1s)
   * @param anchor Anchor avec autoScrollPauseTime optionnel
   * @returns true si on doit faire une pause, false sinon
   */
  shouldPause(anchor: AnchorWithPauseTime | null): boolean {
    if (!anchor || !anchor.anchorId) return false;
    // Si autoScrollPauseTime n'est pas défini, on fait une pause avec la durée par défaut
    // Si autoScrollPauseTime est défini mais <= 0, on ne fait pas de pause
    if (anchor.autoScrollPauseTime === undefined) return true;
    return anchor.autoScrollPauseTime > 0;
  }

  /**
   * Récupère la durée de pause pour un anchor
   * Retourne 1s par défaut si autoScrollPauseTime n'est pas défini ou invalide
   * @param anchor Anchor avec autoScrollPauseTime optionnel
   * @returns Durée de pause en millisecondes
   */
  getPauseDuration(anchor: AnchorWithPauseTime): number {
    if (!anchor.autoScrollPauseTime || anchor.autoScrollPauseTime <= 0) {
      return this.DEFAULT_PAUSE_TIME;
    }
    return anchor.autoScrollPauseTime;
  }
}

