/**
 * Utilitaires pour les calculs d'animation
 */

import { AnimationState } from './types';

/**
 * Clamp une valeur entre min et max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalise un progress entre startProgress et endProgress
 * Retourne 0 si progress < startProgress, 1 si progress > endProgress
 */
export function normalizeProgress(
  progress: number,
  startProgress: number = 0,
  endProgress: number = 1
): number {
  if (progress < startProgress) return 0;
  if (progress > endProgress) return 1;
  if (startProgress === endProgress) return 1;
  
  return (progress - startProgress) / (endProgress - startProgress);
}

/**
 * Interpolation linéaire entre deux valeurs
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Easing function (ease-out)
 */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function (ease-in-out)
 */
export function easeInOut(t: number): number {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Crée un état d'animation initial (toutes les valeurs à leur état par défaut)
 */
export function createInitialAnimationState(): AnimationState {
  return {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    rotation: 0,
  };
}

/**
 * Calcule la direction du magnétisme basée sur la direction du scroll
 * Retourne -1 pour backward, 1 pour forward, 0 pour null
 */
export function getMagnetismDirection(direction: 'forward' | 'backward' | null): number {
  if (direction === 'forward') return 1;
  if (direction === 'backward') return -1;
  return 0;
}

