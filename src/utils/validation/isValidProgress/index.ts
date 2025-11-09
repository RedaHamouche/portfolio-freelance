/**
 * Valide qu'un progress est dans la plage valide [0, 1]
 * Source unique de vérité pour la validation du progress
 * 
 * @param progress - Le progress à valider
 * @returns true si le progress est valide, false sinon
 */
export function isValidProgress(progress: number): boolean {
  return !isNaN(progress) && progress >= 0 && progress <= 1;
}

