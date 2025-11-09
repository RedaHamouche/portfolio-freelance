import type { ManualScrollSyncUseCase } from '@/components/app/MapScroller/hooks/useManualScrollSync/application/ManualScrollSyncUseCase';
import type { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';

/**
 * Action pour mettre à jour la direction du scroll dans Redux
 * Utilise ProgressUpdateService pour centraliser la mise à jour
 * 
 * @param useCase - Le use case pour obtenir la direction
 * @param progressUpdateService - Le service pour mettre à jour le progress et la direction
 * @param isAutoPlayingRef - Ref pour vérifier si l'autoplay est actif
 * @param lastScrollDirectionRef - Ref pour stocker la dernière direction
 */
export function updateScrollDirection(
  useCase: ManualScrollSyncUseCase,
  progressUpdateService: ProgressUpdateService,
  isAutoPlayingRef: { current: boolean },
  lastScrollDirectionRef: { current: string | null }
): void {
  if (isAutoPlayingRef.current) return;

  const direction = useCase.getScrollDirection();
  if (direction && direction !== lastScrollDirectionRef.current) {
    lastScrollDirectionRef.current = direction;
    // Utiliser le service pour mettre à jour la direction (mais pas le progress ici)
    // Le service gère setLastScrollDirection et setAutoScrollDirection
    const currentProgress = useCase.getCurrentProgress();
    progressUpdateService.updateProgressWithDirection(currentProgress, direction);
  }
}

