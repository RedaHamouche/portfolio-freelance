import { AUTO_SCROLL_CONFIG } from '@/config';

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
   * @param isDesktop Indique si on est sur desktop (pour choisir la vitesse appropriée)
   * @param speedMultiplier Multiplicateur de vitesse pour l'easing (optionnel, défaut: 1)
   * @returns Nouveau progress (0-1) avec wraparound circulaire
   */
  calculateNextProgress(
    currentProgress: number,
    direction: 1 | -1,
    dt: number,
    isDesktop: boolean,
    speedMultiplier: number = 1
  ): number {
    // Utiliser la vitesse appropriée selon le device
    const baseSpeed = isDesktop ? AUTO_SCROLL_CONFIG.desktop.speed : AUTO_SCROLL_CONFIG.mobile.speed;
    // Appliquer le multiplicateur d'easing
    const speed = baseSpeed * speedMultiplier;
    const newProgress = (currentProgress + direction * speed * dt + 1) % 1;
    return newProgress;
  }
}

