import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';

/**
 * Synchronise la position de scroll avec le progress
 */
export function syncScrollPosition(
  newProgress: number,
  globalPathLength: number,
  isModalOpen: boolean
): void {
  // Ne pas scroller si la modal est ouverte (évite les conflits avec la restauration du scroll de la modal)
  if (isModalOpen) {
    return;
  }

  try {
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
    const targetScrollY = calculateScrollYFromProgress(newProgress, maxScroll);
    
    // Valider que targetScrollY est un nombre valide
    if (isNaN(targetScrollY) || !isFinite(targetScrollY)) {
      console.warn(`[useAutoPlay] targetScrollY invalide: ${targetScrollY}, scroll ignoré`);
      return;
    }
    
    // window.scrollTo() ne déclenche pas les événements wheel/touch, donc useManualScrollSync
    // ne détectera pas ce scroll comme manuel (on écoute uniquement wheel/touch pour les scrolls manuels)
    window.scrollTo({ top: targetScrollY, behavior: 'auto' });
  } catch (error) {
    // Gérer les erreurs de window.scrollTo() (peut échouer si la modal est en train de restaurer le scroll)
    console.warn('[useAutoPlay] Erreur lors du scroll:', error);
  }
}

