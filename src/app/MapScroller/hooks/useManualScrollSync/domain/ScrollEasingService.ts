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

    // Calculer le facteur d'interpolation
    // 1. Utiliser le facteur d'inertie pour la vitesse de base
    const rawInterpolationFactor = this.inertiaFactor;
    
    // 2. Appliquer la courbe d'easing pour modifier la vitesse selon la courbe
    // L'easing transforme le facteur d'interpolation pour créer une courbe d'animation
    const easedInterpolationFactor = this.easingFunction(rawInterpolationFactor);
    
    // 3. Interpoler avec le facteur final (inertie + easing)
    let newValue = current + delta * easedInterpolationFactor;
    
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

