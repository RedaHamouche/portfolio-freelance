/**
 * Valide qu'une valeur scrollY est valide (nombre fini)
 * Source unique de vérité pour la validation de scrollY
 * 
 * @param scrollY - La valeur scrollY à valider
 * @returns true si scrollY est valide, false sinon
 */
export function isValidScrollY(scrollY: number): boolean {
  return !isNaN(scrollY) && isFinite(scrollY);
}

