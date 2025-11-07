import type { PathDomainAPI } from '@/templating/domains/path/api';

/**
 * Service de domaine pour calculer l'easing de vitesse lors de l'autoplay
 * Ralentit à l'approche des composants et accélère après les avoir passés
 */
export class AutoPlayEasingService {
  constructor(private readonly pathDomain: PathDomainAPI) {}

  /**
   * Calcule un multiplicateur de vitesse basé sur la proximité au prochain composant
   * @param currentProgress Progress actuel (0-1)
   * @param direction Direction du scroll (1 = forward, -1 = backward)
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   * @param easingConfig Configuration de l'easing
   * @returns Multiplicateur de vitesse (0-1 pour ralentir, >1 pour accélérer)
   */
  calculateSpeedMultiplier(
    currentProgress: number,
    direction: 1 | -1,
    isDesktop: boolean,
    easingConfig: {
      approachDistance: number; // Distance à partir de laquelle on commence à ralentir (en progress, ex: 0.05 = 5%)
      minSpeed: number; // Vitesse minimale à l'approche (ex: 0.3 = 30% de la vitesse normale)
      accelerationDistance: number; // Distance après le composant pour accélérer (en progress)
      maxSpeed: number; // Vitesse maximale après le composant (ex: 1.5 = 150% de la vitesse normale)
    }
  ): number {
    const scrollDirection = direction === 1 ? 'forward' : 'backward';
    
    // Trouver le prochain composant dans la direction du scroll
    const nextComponent = this.pathDomain.findNextComponentInDirection(
      currentProgress,
      scrollDirection,
      isDesktop
    );

    if (!nextComponent) {
      // Pas de composant trouvé, vitesse normale
      return 1;
    }

    const componentProgress = nextComponent.position.progress;
    
    // Calculer la distance au composant (gérer le wraparound circulaire)
    let distance: number;
    if (direction === 1) {
      // Forward : on va de currentProgress vers componentProgress
      if (componentProgress > currentProgress) {
        distance = componentProgress - currentProgress;
      } else {
        // Wraparound : on passe par 1 puis 0
        distance = (1 - currentProgress) + componentProgress;
      }
    } else {
      // Backward : on va de currentProgress vers componentProgress
      if (componentProgress < currentProgress) {
        distance = currentProgress - componentProgress;
      } else {
        // Wraparound : on passe par 0 puis 1
        distance = currentProgress + (1 - componentProgress);
      }
    }

    // Normaliser la distance pour le wraparound (la distance ne peut pas être > 0.5)
    if (distance > 0.5) {
      distance = 1 - distance;
    }

    // Vérifier si on a déjà passé le composant
    let hasPassedComponent = false;
    if (direction === 1) {
      // Forward : on a passé si currentProgress > componentProgress (sauf wraparound)
      if (componentProgress > 0.9 && currentProgress < 0.1) {
        // Cas spécial : wraparound, on n'a pas encore passé
        hasPassedComponent = false;
      } else {
        hasPassedComponent = currentProgress > componentProgress;
      }
    } else {
      // Backward : on a passé si currentProgress < componentProgress (sauf wraparound)
      if (componentProgress < 0.1 && currentProgress > 0.9) {
        // Cas spécial : wraparound, on n'a pas encore passé
        hasPassedComponent = false;
      } else {
        hasPassedComponent = currentProgress < componentProgress;
      }
    }

    // Si on vient de passer le composant (dans la zone d'accélération)
    if (hasPassedComponent && distance <= easingConfig.accelerationDistance) {
      // Accélérer progressivement : plus on s'éloigne, plus on accélère
      const normalizedDistance = distance / easingConfig.accelerationDistance; // 0 à 1
      const easingFactor = 1 - (1 - normalizedDistance) * (1 - normalizedDistance); // Courbe ease-out
      const speedMultiplier = 1 + (easingConfig.maxSpeed - 1) * (1 - easingFactor);
      return Math.min(speedMultiplier, easingConfig.maxSpeed);
    }

    // Si on est très proche du composant (dans la zone d'approche) et qu'on ne l'a pas encore passé
    if (!hasPassedComponent && distance <= easingConfig.approachDistance) {
      // Ralentir progressivement : plus on est proche, plus on ralentit
      // Utiliser une courbe ease-in pour un ralentissement doux
      const normalizedDistance = distance / easingConfig.approachDistance; // 0 à 1
      const easingFactor = normalizedDistance * normalizedDistance; // Courbe quadratique
      const speedMultiplier = easingConfig.minSpeed + (1 - easingConfig.minSpeed) * easingFactor;
      return Math.max(speedMultiplier, easingConfig.minSpeed);
    }

    // Vitesse normale (loin du composant)
    return 1;
  }
}

