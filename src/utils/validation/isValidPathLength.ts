import { DEFAULT_PATH_LENGTH } from '@/config';

/**
 * Valide qu'un pathLength est valide
 * Source unique de vérité pour la validation du pathLength
 * 
 * @param pathLength - Le pathLength à valider
 * @param acceptDefault - Si true, accepte DEFAULT_PATH_LENGTH comme valide (défaut: false)
 * @returns true si le pathLength est valide, false sinon
 */
export function isValidPathLength(pathLength: number, acceptDefault: boolean = false): boolean {
  if (pathLength <= 0) return false;
  if (!acceptDefault && pathLength <= DEFAULT_PATH_LENGTH) return false;
  return true;
}

