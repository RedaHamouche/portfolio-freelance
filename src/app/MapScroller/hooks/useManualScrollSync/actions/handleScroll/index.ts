import type { AppDispatch } from '@/store';
import type { ManualScrollSyncUseCase } from '../../ManualScrollSyncUseCase';

/**
 * Interface pour les refs nécessaires à handleScroll
 */
export interface HandleScrollRefs {
  pendingUpdateRef: { current: boolean };
  rafIdRef: { current: number | null };
}

/**
 * Interface pour les callbacks nécessaires à handleScroll
 */
export interface HandleScrollCallbacks {
  handleInitializationAndVelocity: () => void;
  processScrollUpdate: () => void;
  scheduleScrollEndCheck: () => void;
  getUseCase: () => ManualScrollSyncUseCase;
  onScrollState?: (isScrolling: boolean) => void;
}

/**
 * Handler pour l'événement scroll
 * Fonction pure, testable individuellement
 * 
 * @param dispatch - La fonction dispatch de Redux
 * @param refs - Les refs nécessaires
 * @param callbacks - Les callbacks nécessaires
 * @param globalPathLength - La longueur globale du path
 * @param isModalOpen - Si la modal est ouverte
 */
export function handleScroll(
  dispatch: AppDispatch,
  refs: HandleScrollRefs,
  callbacks: HandleScrollCallbacks,
  globalPathLength: number,
  isModalOpen: boolean
): void {
  if (typeof window === 'undefined') return;
  if (isModalOpen) return;

  // Accepter globalPathLength même s'il est à DEFAULT_PATH_LENGTH (valeur par défaut)
  // mais bloquer si vraiment invalide (<= 0)
  if (globalPathLength <= 0) return;

  // Gérer l'initialisation et la mise à jour de la vélocité de manière centralisée
  callbacks.handleInitializationAndVelocity();

  // Programmer la mise à jour via RAF
  if (!refs.pendingUpdateRef.current) {
    refs.pendingUpdateRef.current = true;
    if (refs.rafIdRef.current === null) {
      refs.rafIdRef.current = requestAnimationFrame(() => {
        callbacks.processScrollUpdate();
      });
    }
  }

  if (callbacks.onScrollState) {
    callbacks.onScrollState(true);
  }

  callbacks.getUseCase().updateLastScrollTime();

  // OPTIMISATION: Détecter l'arrêt du scroll avec setTimeout au lieu d'un RAF continu
  callbacks.scheduleScrollEndCheck();
}

