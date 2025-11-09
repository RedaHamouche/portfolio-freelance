import { syncScrollPosition as syncScrollPositionUtil } from '@/utils/scrollUtils/syncScrollPosition';

/**
 * Synchronise la position de scroll avec le progress
 * Utilise l'utilitaire centralisé pour éviter les doublons
 */
export function syncScrollPosition(
  newProgress: number,
  globalPathLength: number,
  isModalOpen: boolean
): void {
  syncScrollPositionUtil(newProgress, globalPathLength, isModalOpen, {
    behavior: 'auto',
    logPrefix: '[useAutoPlay]',
  });
}

