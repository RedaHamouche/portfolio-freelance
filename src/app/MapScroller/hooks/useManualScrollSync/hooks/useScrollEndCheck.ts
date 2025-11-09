import { SCROLL_CONFIG } from '@/config';
import type { ManualScrollSyncUseCase } from '../ManualScrollSyncUseCase';

/**
 * Fonction utilitaire pour programmer la vérification de fin de scroll
 * Utilise setTimeout au lieu d'un RAF continu pour optimiser les performances
 * 
 * @param getUseCase - Fonction pour obtenir le useCase
 * @param onScrollState - Callback optionnel pour notifier l'arrêt du scroll
 * @param scrollEndTimeoutRef - Ref pour stocker le timeout
 */
export function scheduleScrollEndCheck(
  getUseCase: () => ManualScrollSyncUseCase,
  onScrollState: ((isScrolling: boolean) => void) | undefined,
  scrollEndTimeoutRef: { current: NodeJS.Timeout | null }
): void {
  // Annuler le timeout précédent si présent
  if (scrollEndTimeoutRef.current !== null) {
    clearTimeout(scrollEndTimeoutRef.current);
    scrollEndTimeoutRef.current = null;
  }

  // Programmer la vérification après SCROLL_END_DELAY (150ms)
  scrollEndTimeoutRef.current = setTimeout(() => {
    const isEnded = getUseCase().checkScrollEnd();
    if (isEnded && onScrollState) {
      onScrollState(false);
    }
    scrollEndTimeoutRef.current = null;
  }, SCROLL_CONFIG.SCROLL_END_DELAY);
}

