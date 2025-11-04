/**
 * Types pour les animations basées sur le progress
 */

export type ScrollDirection = 'forward' | 'backward' | null;

/**
 * Configuration de base pour une animation
 */
export interface BaseAnimationConfig {
  /** Progress de début (0-1) où l'animation commence */
  startProgress?: number;
  /** Progress de fin (0-1) où l'animation se termine */
  endProgress?: number;
  /** Active l'animation (par défaut: true) */
  enabled?: boolean;
}

/**
 * Configuration pour l'animation de magnétisme
 */
export interface MagnetismAnimationConfig extends BaseAnimationConfig {
  type: 'magnetism';
  /** Intensité du magnétisme (en pixels) */
  intensity?: number;
  /** Multiplicateur basé sur le progress (0-1) */
  progressMultiplier?: number;
  /** Sensibilité à la direction (0-1) */
  directionSensitivity?: number;
}

/**
 * Configuration pour l'animation de fondu progressif
 */
export interface FadeInAnimationConfig extends BaseAnimationConfig {
  type: 'fadeIn';
  /** Valeur d'opacité initiale (0-1) */
  from?: number;
  /** Valeur d'opacité finale (0-1) */
  to?: number;
  /** Utiliser un easing personnalisé */
  ease?: 'linear' | 'easeOut' | 'easeInOut';
}

/**
 * Configuration pour l'animation d'apparition de lettres (stagger)
 */
export interface StaggerFadeInAnimationConfig extends BaseAnimationConfig {
  type: 'staggerFadeIn';
  /** Délai entre chaque lettre (en secondes) */
  staggerDelay?: number;
  /** Durée de l'animation de chaque lettre (en secondes) */
  duration?: number;
  /** Animation combinée : slide + fade */
  withSlide?: boolean;
  /** Distance du slide (en pixels) si withSlide est true */
  slideDistance?: number;
}

/**
 * Union type pour toutes les configurations d'animation
 */
export type AnimationConfig = 
  | MagnetismAnimationConfig 
  | FadeInAnimationConfig 
  | StaggerFadeInAnimationConfig;

/**
 * Configuration complète pour useProgressAnimation
 */
export interface UseProgressAnimationConfig {
  animations: AnimationConfig[];
}

/**
 * État interne de l'animation
 */
export interface AnimationState {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotation: number;
}

