import { isBrowser } from '@/utils/ssr/isBrowser';
import { isValidScrollY } from '@/utils/validation/isValidScrollY';
import { calculateScrollY } from '@/utils/scrollUtils/calculateScrollY';

export interface SyncScrollPositionOptions {
  behavior?: ScrollBehavior;
  logPrefix?: string;
}

/**
 * Synchronise la position de scroll avec le progress
 * Source unique de vérité pour window.scrollTo()
 * 
 * @param progress - Le progress (0-1)
 * @param globalPathLength - La longueur globale du path
 * @param isModalOpen - Si la modal est ouverte (évite les conflits)
 * @param options - Options supplémentaires (behavior, logPrefix)
 * @returns true si le scroll a été effectué, false sinon
 */
export function syncScrollPosition(
  progress: number,
  globalPathLength: number,
  isModalOpen: boolean,
  options: SyncScrollPositionOptions = {}
): boolean {
  const { behavior = 'auto', logPrefix = '[syncScrollPosition]' } = options;

  // Ne pas scroller si la modal est ouverte (évite les conflits avec la restauration du scroll de la modal)
  if (isModalOpen) {
    return false;
  }

  if (!isBrowser()) {
    return false;
  }

  try {
    const targetScrollY = calculateScrollY(progress, globalPathLength);

    // Valider que targetScrollY est un nombre valide
    if (!isValidScrollY(targetScrollY)) {
      console.warn(`${logPrefix} targetScrollY invalide: ${targetScrollY}, scroll ignoré`);
      return false;
    }

    // window.scrollTo() ne déclenche pas les événements wheel/touch, donc useManualScrollSync
    // ne détectera pas ce scroll comme manuel (on écoute uniquement wheel/touch pour les scrolls manuels)
    window.scrollTo({ top: targetScrollY, behavior });
    return true;
  } catch (error) {
    // Gérer les erreurs de window.scrollTo() (peut échouer si la modal est en train de restaurer le scroll)
    console.warn(`${logPrefix} Erreur lors du scroll:`, error);
    return false;
  }
}

