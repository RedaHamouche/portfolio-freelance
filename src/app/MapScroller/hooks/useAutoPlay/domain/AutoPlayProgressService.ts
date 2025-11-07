import { AUTO_SCROLL_SPEED } from '@/config';

/**
 * Service de domaine pour calculer le prochain progress lors de l'autoplay
 * Gère le calcul du progress avec vitesse, direction et wraparound circulaire
 */
export class AutoPlayProgressService {
  /**
   * Calcule le prochain progress basé sur la vitesse, direction et delta time
   * @param currentProgress Progress actuel (0-1)
   * @param direction Direction du scroll (1 = forward, -1 = backward)
   * @param dt Delta time en secondes
   * @returns Nouveau progress (0-1) avec wraparound circulaire
   */
  calculateNextProgress(
    currentProgress: number,
    direction: 1 | -1,
    dt: number
  ): number {
    const newProgress = (currentProgress + direction * AUTO_SCROLL_SPEED * dt + 1) % 1;
    return newProgress;
  }
}

