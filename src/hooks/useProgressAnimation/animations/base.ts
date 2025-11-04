/**
 * Interface de base pour les animations
 */

import { AnimationState } from '../types';

/**
 * Contexte partagé pour les animations
 */
export interface AnimationContext {
  progress: number;
  direction: 'forward' | 'backward' | null;
  elementRef: React.RefObject<HTMLElement>;
}

/**
 * Résultat d'une animation (valeurs calculées)
 */
export type AnimationResult = Partial<AnimationState>;

/**
 * Interface pour les animations simples (calcul uniquement)
 */
export interface SimpleAnimation<TConfig> {
  type: string;
  calculate: (
    state: AnimationState,
    context: AnimationContext,
    config: TConfig
  ) => AnimationResult;
}

/**
 * Interface pour les animations complexes (avec manipulation DOM)
 */
export interface ComplexAnimation<TConfig> {
  type: string;
  calculate?: (
    state: AnimationState,
    context: AnimationContext,
    config: TConfig
  ) => AnimationResult;
  setup?: (
    elementRef: React.RefObject<HTMLElement>
  ) => void | (() => void); // cleanup function
  update?: (
    elementRef: React.RefObject<HTMLElement>,
    context: AnimationContext,
    config: TConfig
  ) => void;
}

export type Animation<TConfig = unknown> = SimpleAnimation<TConfig> | ComplexAnimation<TConfig>;

