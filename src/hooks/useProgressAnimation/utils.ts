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
 * Calcule la distance la plus courte entre deux points sur un cercle (0-1)
 * Gère le wraparound (0 ↔ 1)
 */
function getCircularDistance(a: number, b: number): number {
  const direct = Math.abs(a - b);
  const wrapped = 1 - direct;
  return Math.min(direct, wrapped);
}

/**
 * Vérifie si un progress est dans une plage en tenant compte de la boucle (0 ↔ 1)
 */
function isInCircularRange(
  progress: number,
  startProgress: number,
  endProgress: number
): boolean {
  // Normaliser tous les valeurs entre 0 et 1
  const normalizedProgress = ((progress % 1) + 1) % 1;
  const normalizedStart = ((startProgress % 1) + 1) % 1;
  const normalizedEnd = ((endProgress % 1) + 1) % 1;
  
  // Si la plage ne traverse pas la boucle (start < end)
  if (normalizedStart <= normalizedEnd) {
    return normalizedProgress >= normalizedStart && normalizedProgress <= normalizedEnd;
  }
  
  // Si la plage traverse la boucle (start > end, ex: 0.985 à 0.015)
  // On est dans la plage si :
  // - progress >= start (dans la partie haute: 0.985 à 1.0)
  // - progress <= end (dans la partie basse: 0.0 à 0.015)
  // - OU progress est proche de start via wraparound (ex: progress = 0.97 quand start = 0.985)
  //   Cela signifie qu'on est proche de la fin du cercle (0.97 à 0.985)
  const range = (1 - normalizedStart) + normalizedEnd; // Distance totale de la plage
  const distanceToStart = getCircularDistance(normalizedProgress, normalizedStart);
  const distanceToEnd = getCircularDistance(normalizedProgress, normalizedEnd);
  
  // On est dans la plage si on est proche de start ou end (via la distance circulaire)
  // et que la distance totale est dans la plage
  return (normalizedProgress >= normalizedStart || normalizedProgress <= normalizedEnd) ||
         (distanceToStart <= range / 2 || distanceToEnd <= range / 2);
}

/**
 * Normalise un progress entre startProgress et endProgress
 * Gère le wraparound (0 ↔ 1) pour le scroll infini
 * Retourne 0 si progress n'est pas dans la plage, 1 si progress dépasse la plage
 */
export function normalizeProgress(
  progress: number,
  startProgress: number = 0,
  endProgress: number = 1
): number {
  if (startProgress === endProgress) return 1;
  
  // Normaliser toutes les valeurs entre 0 et 1
  const normalizedProgress = ((progress % 1) + 1) % 1;
  const normalizedStart = ((startProgress % 1) + 1) % 1;
  const normalizedEnd = ((endProgress % 1) + 1) % 1;
  
  // Vérifier si on est dans la plage (en tenant compte de la boucle)
  if (!isInCircularRange(normalizedProgress, normalizedStart, normalizedEnd)) {
    // Si on n'est pas dans la plage, déterminer si on est avant ou après
    if (normalizedStart <= normalizedEnd) {
      // Plage normale (pas de wraparound)
      if (normalizedProgress < normalizedStart) return 0;
      if (normalizedProgress > normalizedEnd) return 1;
    } else {
      // Plage qui traverse la boucle (ex: 0.985 à 0.015)
      // Si progress est entre endProgress et startProgress (hors de la plage)
      if (normalizedProgress > normalizedEnd && normalizedProgress < normalizedStart) {
        // On est dans la zone "morte", déterminer si on est plus proche du start ou du end
        const distanceToStart = getCircularDistance(normalizedProgress, normalizedStart);
        const distanceToEnd = getCircularDistance(normalizedProgress, normalizedEnd);
        return distanceToStart < distanceToEnd ? 0 : 1;
      }
    }
  }
  
  // Calculer la normalisation dans la plage
  if (normalizedStart <= normalizedEnd) {
    // Plage normale
    return (normalizedProgress - normalizedStart) / (normalizedEnd - normalizedStart);
  } else {
    // Plage qui traverse la boucle (ex: 0.985 à 0.015)
    const range = (1 - normalizedStart) + normalizedEnd; // Distance totale de la plage (0.015 + 0.015 = 0.03)
    
    // Calculer la distance depuis startProgress en tenant compte du wraparound
    let distance: number;
    if (normalizedProgress >= normalizedStart) {
      // On est dans la partie après startProgress (ex: progress entre 0.985 et 1.0)
      distance = normalizedProgress - normalizedStart;
    } else {
      // On est dans la partie avant endProgress (après le wraparound, ex: progress entre 0.0 et 0.015)
      // OU on est proche de startProgress via wraparound (ex: progress = 0.97 quand start = 0.985)
      // Calculer la distance en traversant la boucle
      distance = (1 - normalizedStart) + normalizedProgress;
    }
    
    // Clamper le résultat entre 0 et 1
    const normalized = Math.max(0, Math.min(1, distance / range));
    return normalized;
  }
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

