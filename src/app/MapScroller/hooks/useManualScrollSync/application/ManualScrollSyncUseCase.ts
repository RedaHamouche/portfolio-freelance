import { ScrollEasingService } from '../domain/ScrollEasingService';
import { ScrollProgressCalculator } from '../domain/ScrollProgressCalculator';
import { ScrollStateDetector } from '../domain/ScrollStateDetector';

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
  private state: ManualScrollSyncState;

  constructor(
    easingService: ScrollEasingService,
    progressCalculator: ScrollProgressCalculator,
    stateDetector: ScrollStateDetector,
    initialState?: Partial<ManualScrollSyncState>
  ) {
    this.easingService = easingService;
    this.progressCalculator = progressCalculator;
    this.stateDetector = stateDetector;
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
   * Effectue une itération de l'animation d'easing
   * Retourne true si l'animation doit continuer
   */
  animateEasing(): boolean {
    const result = this.easingService.interpolate(
      this.state.currentProgress,
      this.state.targetProgress
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

