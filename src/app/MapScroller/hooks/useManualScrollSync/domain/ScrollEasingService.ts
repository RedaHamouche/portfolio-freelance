/**
 * Service de domaine pour gérer l'easing/inertie du scroll
 * Calcule l'interpolation entre une position actuelle et une position cible
 */
export class ScrollEasingService {
  private readonly easingFactor: number;
  private readonly minDelta: number;

  constructor(easingFactor: number = 0.12, minDelta: number = 0.0001) {
    this.easingFactor = easingFactor;
    this.minDelta = minDelta;
  }

  /**
   * Calcule la différence entre deux valeurs de progress en gérant le wraparound circulaire
   */
  calculateCircularDelta(current: number, target: number): number {
    let delta = target - current;
    // Gérer le wraparound (ex: de 0.95 à 0.05, la distance est 0.1, pas 0.9)
    if (Math.abs(delta) > 0.5) {
      delta = delta > 0 ? delta - 1 : delta + 1;
    }
    return delta;
  }

  /**
   * Interpole la valeur actuelle vers la cible avec easing
   * Retourne la nouvelle valeur interpolée et un booléen indiquant si l'animation doit continuer
   */
  interpolate(current: number, target: number): {
    newValue: number;
    shouldContinue: boolean;
  } {
    const delta = this.calculateCircularDelta(current, target);

    // Si la différence est très petite, arrêter l'animation
    if (Math.abs(delta) < this.minDelta) {
      return {
        newValue: target,
        shouldContinue: false,
      };
    }

    // Interpolation linéaire avec easing
    let newValue = current + delta * this.easingFactor;
    // Normaliser entre 0 et 1 (gérer le wraparound avec modulo)
    newValue = ((newValue % 1) + 1) % 1;

    return {
      newValue,
      shouldContinue: true,
    };
  }

  /**
   * Vérifie si l'animation doit continuer en comparant les valeurs
   */
  shouldContinueAnimation(current: number, target: number): boolean {
    const delta = this.calculateCircularDelta(current, target);
    return Math.abs(delta) >= this.minDelta;
  }
}

