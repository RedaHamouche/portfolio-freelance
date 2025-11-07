import { ScrollEasingService } from '../domain/ScrollEasingService';
import { ScrollProgressCalculator } from '../domain/ScrollProgressCalculator';
import { ScrollStateDetector } from '../domain/ScrollStateDetector';
import { ScrollVelocityService } from '../domain/ScrollVelocityService';

export type ScrollDirection = 'forward' | 'backward' | null;

export interface ManualScrollSyncState {
  currentProgress: number;
  targetProgress: number;
  lastScrollTime: number;
  prevProgress: number | null;
}

export interface ManualScrollSyncCallbacks {
  onProgressUpdate: (progress: number) => void;
  onDirectionUpdate: (direction: ScrollDirection) => void;
  onScrollStateChange?: (isScrolling: boolean) => void;
}

/**
 * Use case pour synchroniser le scroll manuel avec le progress
 * Orchestre les domain services pour gérer le scroll avec easing
 */
export class ManualScrollSyncUseCase {
  private readonly easingService: ScrollEasingService;
  private readonly progressCalculator: ScrollProgressCalculator;
  private readonly stateDetector: ScrollStateDetector;
  private readonly velocityService: ScrollVelocityService;
  private state: ManualScrollSyncState;
  private readonly velocityConfig: {
    enabled: boolean;
    friction: number;
    maxVelocity: number;
    velocityToInertiaMultiplier: number;
    baseInertiaFactor: number;
  };
  private lastInertiaFactor: number; // Pour lisser les changements d'inertie

  constructor(
    easingService: ScrollEasingService,
    progressCalculator: ScrollProgressCalculator,
    stateDetector: ScrollStateDetector,
    velocityService: ScrollVelocityService,
    velocityConfig: {
      enabled: boolean;
      friction: number;
      maxVelocity: number;
      velocityToInertiaMultiplier: number;
      baseInertiaFactor: number;
    },
    initialState?: Partial<ManualScrollSyncState>
  ) {
    this.easingService = easingService;
    this.progressCalculator = progressCalculator;
    this.stateDetector = stateDetector;
    this.velocityService = velocityService;
    this.velocityConfig = velocityConfig;
    this.lastInertiaFactor = velocityConfig.baseInertiaFactor; // Initialiser avec l'inertie de base
    this.state = {
      currentProgress: initialState?.currentProgress ?? 0,
      targetProgress: initialState?.targetProgress ?? 0,
      lastScrollTime: initialState?.lastScrollTime ?? performance.now(),
      prevProgress: initialState?.prevProgress ?? null,
    };
  }

  /**
   * Initialise le state avec la position de scroll actuelle
   * @param globalPathLength Longueur du path
   * @param initialProgress Progress initial optionnel (utilisé si un hash est présent)
   */
  initialize(globalPathLength: number, initialProgress?: number): void {
    const progress = initialProgress ?? this.progressCalculator.calculateInitialProgress(globalPathLength);
    this.state.currentProgress = progress;
    this.state.targetProgress = progress;
    this.state.prevProgress = progress;
    // Réinitialiser l'inertie à la valeur de base pour éviter les saccades à la reprise
    this.lastInertiaFactor = this.velocityConfig.baseInertiaFactor;
    this.velocityService.reset();
  }

  /**
   * Met à jour la position de scroll et calcule le progress cible
   * Retourne true si une correction de scroll est nécessaire
   */
  updateScrollPosition(scrollY: number, globalPathLength: number): {
    shouldCorrect: boolean;
    correctionY?: number;
  } {
    const result = this.progressCalculator.calculateProgress(scrollY, globalPathLength);
    
    // Sauvegarder l'ancien targetProgress avant de le mettre à jour
    const previousTargetProgress = this.state.targetProgress;
    
    // Mettre à jour la cible pour l'easing
    this.state.targetProgress = result.progress;
    
    // Mettre à jour prevProgress avec l'ancien targetProgress pour la comparaison de direction
    this.state.prevProgress = previousTargetProgress;

    return {
      shouldCorrect: result.shouldCorrect,
      correctionY: result.correctionY,
    };
  }

  /**
   * Met à jour le temps du dernier scroll
   */
  updateLastScrollTime(): void {
    this.state.lastScrollTime = performance.now();
  }

  /**
   * Met à jour la vélocité depuis un événement wheel
   */
  updateVelocityFromWheel(deltaY: number): void {
    this.velocityService.updateVelocityFromWheel(deltaY, performance.now());
  }

  /**
   * Met à jour la vélocité depuis la position de scroll
   * Réinitialise la vélocité si elle était très faible (pour éviter les saccades à la reprise)
   */
  updateVelocity(scrollY: number): void {
    // Si la vélocité était très faible, réinitialiser avant de mettre à jour
    // Cela évite les saccades quand on reprend le scroll après une pause
    if (!this.velocityService.isSignificant(0.001)) {
      this.velocityService.reset();
    }
    this.velocityService.updateVelocity(scrollY, performance.now());
  }

  /**
   * Effectue une itération de l'animation d'easing
   * Retourne true si l'animation doit continuer
   */
  animateEasing(): boolean {
    // Calculer le facteur d'inertie dynamique basé sur la vélocité
    let dynamicInertiaFactor: number | undefined = undefined;
    
    if (this.velocityConfig.enabled) {
      // Seuil minimum pour éviter les micro-mouvements saccadés
      const VELOCITY_THRESHOLD = 0.001;
      
      // Vérifier si la vélocité est significative avant d'appliquer la friction
      // Optimisation : utiliser getAbsoluteVelocity() directement pour éviter double Math.abs()
      const currentAbsoluteVelocity = this.velocityService.getAbsoluteVelocity();
      
      if (currentAbsoluteVelocity > VELOCITY_THRESHOLD) {
        // Appliquer la friction à la vélocité (décroissance progressive)
        const velocity = this.velocityService.applyFriction();
        const absoluteVelocity = Math.abs(velocity); // Recalcul après friction
        
        // Convertir la vélocité en facteur d'inertie
        // Plus la vélocité est élevée, plus l'inertie est forte (plus lent à s'arrêter)
        // Dans notre système : inertiaFactor plus petit = plus d'inertie (plus lent)
        // Donc : baseInertiaFactor - (velocity * multiplier) pour augmenter l'inertie
        const velocityContribution = absoluteVelocity * this.velocityConfig.velocityToInertiaMultiplier;
        const targetInertiaFactor = Math.max(0.01, this.velocityConfig.baseInertiaFactor - velocityContribution);
        
        // Lisser le changement d'inertie pour éviter les saccades
        // Interpolation linéaire avec un facteur de lissage (0.3 = 30% du nouveau, 70% de l'ancien)
        // Optimisation : éviter le lissage si la différence est très petite (< 0.001)
        const inertiaDelta = Math.abs(targetInertiaFactor - this.lastInertiaFactor);
        if (inertiaDelta > 0.001) {
          const SMOOTHING_FACTOR = 0.3;
          dynamicInertiaFactor = this.lastInertiaFactor * (1 - SMOOTHING_FACTOR) + targetInertiaFactor * SMOOTHING_FACTOR;
        } else {
          // Si la différence est très petite, utiliser directement la valeur cible
          dynamicInertiaFactor = targetInertiaFactor;
        }
        this.lastInertiaFactor = dynamicInertiaFactor;
      } else {
        // Si la vélocité est trop faible, réinitialiser pour éviter les micro-mouvements
        this.velocityService.reset();
        // Retourner progressivement à l'inertie de base
        // Optimisation : éviter le lissage si déjà proche de la base
        const baseDelta = Math.abs(this.lastInertiaFactor - this.velocityConfig.baseInertiaFactor);
        if (baseDelta > 0.001) {
          const SMOOTHING_FACTOR = 0.2;
          dynamicInertiaFactor = this.lastInertiaFactor * (1 - SMOOTHING_FACTOR) + this.velocityConfig.baseInertiaFactor * SMOOTHING_FACTOR;
          this.lastInertiaFactor = dynamicInertiaFactor;
        } else {
          dynamicInertiaFactor = this.velocityConfig.baseInertiaFactor;
          this.lastInertiaFactor = dynamicInertiaFactor;
        }
      }
    } else {
      // Si la vélocité est désactivée, utiliser l'inertie de base
      dynamicInertiaFactor = this.velocityConfig.baseInertiaFactor;
      this.lastInertiaFactor = dynamicInertiaFactor;
    }

    const result = this.easingService.interpolate(
      this.state.currentProgress,
      this.state.targetProgress,
      dynamicInertiaFactor
    );

    this.state.currentProgress = result.newValue;

    return result.shouldContinue;
  }

  /**
   * Vérifie si le scroll est arrêté
   */
  checkScrollEnd(): boolean {
    return this.stateDetector.isScrollEnded(
      this.state.lastScrollTime,
      performance.now()
    );
  }

  /**
   * Récupère le progress actuel (pour dispatch)
   */
  getCurrentProgress(): number {
    return this.state.currentProgress;
  }


  /**
   * Récupère la direction du scroll basée sur la différence de progress
   * Utilise targetProgress (position réelle du scroll) au lieu de currentProgress (interpolé)
   */
  getScrollDirection(): ScrollDirection {
    if (this.state.prevProgress === null) return null;
    
    // Utiliser targetProgress (position réelle du scroll) au lieu de currentProgress (interpolé avec easing)
    const target = this.state.targetProgress;
    const prev = this.state.prevProgress;
    
    // Gérer le wraparound pour la direction
    const delta = this.easingService.calculateCircularDelta(prev, target);
    
    if (Math.abs(delta) < 0.0001) return null;
    return delta > 0 ? 'forward' : 'backward';
  }
}

