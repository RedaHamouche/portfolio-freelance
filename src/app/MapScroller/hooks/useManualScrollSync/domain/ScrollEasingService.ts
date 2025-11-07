/**
 * Type de fonction d'easing (courbe d'animation)
 */
export type EasingFunction = (t: number) => number;

/**
 * Fonctions d'easing prédéfinies
 */
export const EasingFunctions = {
  /** Easing linéaire (pas de courbe) */
  linear: (t: number) => t,
  
  /** Ease-out (décélération douce) */
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  
  /** Ease-in-out (accélération puis décélération) */
  easeInOut: (t: number) => t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  /** Ease-out quadratique (décélération plus douce) */
  easeOutQuad: (t: number) => t * (2 - t),
  
  /** Ease-out cubique (décélération très douce) */
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
} as const;

/**
 * Service de domaine pour gérer l'easing et l'inertie du scroll
 * Calcule l'interpolation entre une position actuelle et une position cible
 * 
 * Deux concepts découplés :
 * - INERTIE : La force/quantité de mouvement continu (vitesse d'interpolation)
 * - EASING : La courbe d'animation (comment l'animation décélère)
 */
export class ScrollEasingService {
  private readonly inertiaFactor: number; // Force de l'inertie (vitesse d'interpolation)
  private readonly easingFunction: EasingFunction; // Courbe d'easing
  private readonly minDelta: number;

  constructor(
    inertiaFactor: number = 0.12,
    easingFunction: EasingFunction = EasingFunctions.linear,
    minDelta: number = 0.0001
  ) {
    this.inertiaFactor = inertiaFactor;
    this.easingFunction = easingFunction;
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
   * @param current Valeur actuelle
   * @param target Valeur cible
   * @param dynamicInertiaFactor Facteur d'inertie dynamique optionnel (basé sur la vélocité)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interpolate(current: number, target: number, _dynamicInertiaFactor?: number): {
    newValue: number;
    shouldContinue: boolean;
  } {
    // TEMPORAIRE : Désactiver complètement l'easing et la vélocité pour diagnostic
    // Aller directement à la cible sans interpolation
    const delta = this.calculateCircularDelta(current, target);
    const absoluteDelta = Math.abs(delta);

    // Si la différence est très petite, arrêter l'animation
    if (absoluteDelta < this.minDelta) {
      return {
        newValue: target,
        shouldContinue: false,
      };
    }

    // Pas d'interpolation, aller directement à la cible
    return {
      newValue: target,
      shouldContinue: false,
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

