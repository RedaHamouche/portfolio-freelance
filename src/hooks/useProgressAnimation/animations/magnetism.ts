/**
 * Animation de magnétisme
 */

import { AnimationState } from '../types';
import { AnimationContext, AnimationResult, SimpleAnimation } from './base';
import { MagnetismAnimationConfig } from '../types';
import {
  normalizeProgress,
  easeOut,
  getMagnetismDirection,
  clamp,
} from '../utils';

/**
 * Calcule l'animation de magnétisme
 */
function calculate(
  _state: AnimationState,
  context: AnimationContext,
  config: MagnetismAnimationConfig
): AnimationResult {
  const {
    intensity = 20,
    startProgress = 0,
    endProgress = 1,
    progressMultiplier = 1,
    directionSensitivity = 0.8,
  } = config;

  const { progress, direction } = context;

  // Normaliser le progress dans la plage de l'animation
  const normalizedProgress = normalizeProgress(progress, startProgress, endProgress);
  
  // Si l'animation n'est pas active, retourner l'état actuel
  if (normalizedProgress === 0) {
    return { x: 0, y: 0 };
  }

  // Calculer la direction du magnétisme
  const magnetismDirection = getMagnetismDirection(direction);
  
  // Appliquer la sensibilité à la direction
  const directionFactor = direction !== null 
    ? magnetismDirection * directionSensitivity
    : (normalizedProgress > 0.5 ? 1 : -1) * (1 - directionSensitivity);

  // Calculer l'intensité basée sur le progress
  const easedProgress = easeOut(normalizedProgress);
  const currentIntensity = intensity * easedProgress * progressMultiplier;

  // Appliquer le magnétisme
  const magnetismX = directionFactor * currentIntensity;
  const magnetismY = directionFactor * currentIntensity * 0.3;

  return {
    x: clamp(magnetismX, -intensity, intensity),
    y: clamp(magnetismY, -intensity * 0.3, intensity * 0.3),
  };
}

export const magnetismAnimation: SimpleAnimation<MagnetismAnimationConfig> = {
  type: 'magnetism',
  calculate,
};

