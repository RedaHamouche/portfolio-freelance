import { DEFAULT_PATH_LENGTH } from '@/config';

/**
 * Fonction utilitaire pour détecter si on doit réinitialiser le useCase
 * à cause d'un changement de pathLength (passage de la valeur par défaut à la vraie valeur)
 * 
 * @param currentPathLength - La longueur actuelle du path
 * @param lastInitializedPathLength - La dernière longueur utilisée pour l'initialisation
 * @param isInitialized - Si le useCase est déjà initialisé
 * @returns true si on doit réinitialiser
 */
export function shouldReinitializeForPathLength(
  currentPathLength: number,
  lastInitializedPathLength: number,
  isInitialized: boolean
): boolean {
  const pathLengthChanged = lastInitializedPathLength !== currentPathLength;
  const wasDefaultValue = lastInitializedPathLength <= DEFAULT_PATH_LENGTH;
  const isRealValue = currentPathLength > DEFAULT_PATH_LENGTH;

  return pathLengthChanged && wasDefaultValue && isRealValue && isInitialized;
}

