import { setLastScrollDirection, setAutoScrollDirection } from '@/store/scrollSlice';
import type { AppDispatch } from '@/store';
import type { ManualScrollSyncUseCase } from '../../ManualScrollSyncUseCase';

/**
 * Fonction utilitaire pour mettre à jour la direction du scroll dans Redux
 * 
 * @param useCase - Le use case pour obtenir la direction
 * @param dispatch - La fonction dispatch de Redux
 * @param isAutoPlayingRef - Ref pour vérifier si l'autoplay est actif
 * @param lastScrollDirectionRef - Ref pour stocker la dernière direction
 */
export function updateScrollDirection(
  useCase: ManualScrollSyncUseCase,
  dispatch: AppDispatch,
  isAutoPlayingRef: { current: boolean },
  lastScrollDirectionRef: { current: string | null }
): void {
  if (isAutoPlayingRef.current) return;

  const direction = useCase.getScrollDirection();
  if (direction && direction !== lastScrollDirectionRef.current) {
    lastScrollDirectionRef.current = direction;
    dispatch(setLastScrollDirection(direction));
    const autoScrollDirection = direction === 'forward' ? 1 : -1;
    dispatch(setAutoScrollDirection(autoScrollDirection));
  }
}

