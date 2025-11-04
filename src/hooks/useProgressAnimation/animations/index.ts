/**
 * Registre centralisé des animations
 */

import { Animation } from './base';
import { magnetismAnimation } from './magnetism';
import { fadeInAnimation } from './fadeIn';
import { staggerFadeInAnimation } from './staggerFadeIn';

/**
 * Registre de toutes les animations disponibles
 */
const animationRegistry = new Map<string, Animation>([
  ['magnetism', magnetismAnimation as Animation],
  ['fadeIn', fadeInAnimation as Animation],
  ['staggerFadeIn', staggerFadeInAnimation as Animation],
]);

/**
 * Récupère une animation par son type
 */
export function getAnimation(type: string): Animation | undefined {
  return animationRegistry.get(type);
}

/**
 * Enregistre une nouvelle animation
 */
export function registerAnimation(animation: Animation): void {
  animationRegistry.set(animation.type, animation);
}

/**
 * Exporte toutes les animations pour référence
 */
export {
  magnetismAnimation,
  fadeInAnimation,
  staggerFadeInAnimation,
};

