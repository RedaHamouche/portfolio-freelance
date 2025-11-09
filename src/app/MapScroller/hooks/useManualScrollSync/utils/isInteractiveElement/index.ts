/**
 * Fonction utilitaire pour détecter si un élément DOM est interactif
 * Utilisée pour éviter de bloquer l'autoplay sur les éléments interactifs
 * 
 * @param target - L'élément DOM à vérifier
 * @returns true si l'élément est interactif (button, input, etc.)
 */
export function isInteractiveElement(target: HTMLElement | null): boolean {
  if (!target) return false;

  return (
    target.tagName === 'BUTTON' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'TEXTAREA' ||
    !!target.closest('button') ||
    !!target.closest('input') ||
    !!target.closest('select') ||
    !!target.closest('textarea') ||
    !!target.closest('[role="button"]')
  );
}

