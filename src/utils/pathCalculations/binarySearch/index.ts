import type { PathComponentData } from '../index';

/**
 * Recherche binaire pour trouver le composant le plus proche avec progress > target
 * Complexité: O(log n) au lieu de O(n)
 * Retourne le composant avec le plus petit progress qui est > target
 * 
 * @param sorted Array trié par progress croissant
 * @param target Progress cible
 * @returns Le composant le plus proche avec progress > target, ou null si aucun
 */
export function binarySearchForward(
  sorted: PathComponentData[],
  target: number
): PathComponentData | null {
  let left = 0;
  let right = sorted.length - 1;
  let result: PathComponentData | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sorted[mid].position.progress > target) {
      // Ce composant est valide, mais on cherche le plus proche (plus petit progress)
      result = sorted[mid];
      right = mid - 1; // Chercher plus tôt (plus petit index = plus petit progress)
    } else {
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Recherche binaire pour trouver le composant le plus proche avec progress < target
 * Complexité: O(log n) au lieu de O(n)
 * Retourne le composant avec le plus grand progress qui est < target
 * Note: sorted est trié décroissant (plus grand progress en premier)
 * 
 * @param sorted Array trié par progress décroissant
 * @param target Progress cible
 * @returns Le composant le plus proche avec progress < target, ou null si aucun
 */
export function binarySearchBackward(
  sorted: PathComponentData[],
  target: number
): PathComponentData | null {
  let left = 0;
  let right = sorted.length - 1;
  let result: PathComponentData | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sorted[mid].position.progress < target) {
      // Ce composant est valide
      // Dans un array trié décroissant, on veut le premier (index le plus petit) qui est < target
      // car c'est celui avec le plus grand progress
      result = sorted[mid];
      right = mid - 1; // Chercher plus tôt (plus petit index = plus grand progress dans desc)
    } else {
      // sorted[mid].progress >= target, donc on doit aller plus loin (index plus grand)
      left = mid + 1;
    }
  }

  return result;
}

