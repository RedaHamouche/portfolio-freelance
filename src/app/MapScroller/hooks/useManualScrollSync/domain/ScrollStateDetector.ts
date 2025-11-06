/**
 * Service de domaine pour détecter l'état du scroll (en cours ou arrêté)
 */
export class ScrollStateDetector {
  private readonly scrollEndThreshold: number;

  constructor(scrollEndThreshold: number = 150) {
    this.scrollEndThreshold = scrollEndThreshold;
  }

  /**
   * Vérifie si le scroll est arrêté en comparant le temps depuis le dernier événement
   */
  isScrollEnded(lastScrollTime: number, currentTime: number): boolean {
    const timeSinceLastScroll = currentTime - lastScrollTime;
    return timeSinceLastScroll >= this.scrollEndThreshold;
  }

  /**
   * Calcule le temps écoulé depuis le dernier scroll
   */
  getTimeSinceLastScroll(lastScrollTime: number, currentTime: number): number {
    return currentTime - lastScrollTime;
  }
}

