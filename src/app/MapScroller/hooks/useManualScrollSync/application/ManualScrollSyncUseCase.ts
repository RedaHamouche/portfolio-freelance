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
    // TEMPORAIRE : Désactiver complètement la vélocité et l'easing pour diagnostic
    // Aller directement à la cible sans interpolation
    const result = this.easingService.interpolate(
      this.state.currentProgress,
      this.state.targetProgress,
      undefined // Pas de dynamicInertiaFactor
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
   * Récupère le progress cible (position réelle du scroll, sans interpolation)
   * Utile pour diagnostic ou synchronisation directe sans easing
   */
  getTargetProgress(): number {
    return this.state.targetProgress;
  }

  /**
   * Synchronise currentProgress avec targetProgress
   * Utile quand l'easing est désactivé pour maintenir la cohérence
   */
  syncCurrentToTarget(): void {
    this.state.currentProgress = this.state.targetProgress;
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

