import type { ProgressUpdateService } from '../../../../services/ProgressUpdateService';

/**
 * Met à jour le progress et la direction du scroll dans Redux
 * Utilise ProgressUpdateService pour centraliser la mise à jour
 */
export function updateProgress(
  newProgress: number,
  scrollDirection: 'forward' | 'backward',
  progressUpdateService: ProgressUpdateService
): void {
  progressUpdateService.updateProgressWithDirection(newProgress, scrollDirection);
}

