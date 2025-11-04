/**
 * Animation de fondu progressif
 */

import { AnimationState } from '../types';
import { AnimationContext, AnimationResult, SimpleAnimation } from './base';
import { FadeInAnimationConfig } from '../types';
import { normalizeProgress, easeOut, easeInOut, clamp } from '../utils';

/**
 * Calcule l'animation de fondu progressif
 */
function calculate(
  _state: AnimationState,
  context: AnimationContext,
  config: FadeInAnimationConfig
): AnimationResult {
  const {
    from = 0,
    to = 1,
    startProgress = 0,
    endProgress = 1,
    ease = 'easeOut',
  } = config;

  const { progress } = context;

  const normalizedProgress = normalizeProgress(progress, startProgress, endProgress);
  
  // Appliquer l'easing
  let easedProgress = normalizedProgress;
  if (ease === 'easeOut') {
    easedProgress = easeOut(normalizedProgress);
  } else if (ease === 'easeInOut') {
    easedProgress = easeInOut(normalizedProgress);
  }

  // Interpoler entre from et to
  const opacity = from + (to - from) * easedProgress;

  return {
    opacity: clamp(opacity, 0, 1),
  };
}

export const fadeInAnimation: SimpleAnimation<FadeInAnimationConfig> = {
  type: 'fadeIn',
  calculate,
};

