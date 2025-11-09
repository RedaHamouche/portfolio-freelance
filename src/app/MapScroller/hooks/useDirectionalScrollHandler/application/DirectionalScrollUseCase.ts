import { SCROLL_CONFIG, type ScrollDirection } from '@/config';

export interface DirectionalScrollAnimateParams {
  direction: ScrollDirection;
  speed: number;
  currentProgress: number;
  globalPathLength: number;
}

export interface DirectionalScrollAnimateResult {
  newProgress: number;
  scrollDirection: 'forward' | 'backward';
}

/**
 * Use case pour gérer le scroll directionnel
 * Calcule le nouveau progress basé sur la direction et la vitesse
 */
export class DirectionalScrollUseCase {
  /**
   * Calcule le prochain progress pour le scroll directionnel
   * @param params Paramètres d'animation
   * @returns Résultat avec nouveau progress et direction, ou null si pas de direction
   */
  animate(params: DirectionalScrollAnimateParams): DirectionalScrollAnimateResult | null {
    if (!params.direction) return null;

    const pxPerMs = params.speed / 1000;
    const scrollDelta = params.direction === 'bas' ? 1 : -1;
    const newProgress = (params.currentProgress + scrollDelta * (pxPerMs * SCROLL_CONFIG.FRAME_DELAY / params.globalPathLength) + 1) % 1;
    
    // Tracker la direction du scroll (bas = forward, haut = backward avec le sens inversé)
    const scrollDirection = params.direction === 'bas' ? 'forward' : 'backward';

    return {
      newProgress,
      scrollDirection,
    };
  }
}

