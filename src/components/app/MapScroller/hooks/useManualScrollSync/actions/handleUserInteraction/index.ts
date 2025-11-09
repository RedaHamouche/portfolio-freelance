import type { AppDispatch } from '@/store';
import { setAutoPlaying } from '@/store/scrollSlice';
import type { ManualScrollSyncUseCase } from '../../application/ManualScrollSyncUseCase';
import { isInteractiveElement } from '../../utils/isInteractiveElement';
import { isBrowser } from '@/utils/ssr/isBrowser';
import { isValidPathLength } from '@/utils/validation/isValidPathLength';

/**
 * Interface pour les refs nécessaires à handleUserInteraction
 */
export interface HandleUserInteractionRefs {
  isAutoPlayingRef: { current: boolean };
  pendingUpdateRef: { current: boolean };
  rafIdRef: { current: number | null };
  scrollYRef: { current: number };
}

/**
 * Interface pour les callbacks nécessaires à handleUserInteraction
 */
export interface HandleUserInteractionCallbacks {
  handleInitializationAndVelocity: (event?: Event) => void;
  processScrollUpdate: () => void;
  scheduleScrollEndCheck: () => void;
  getUseCase: () => ManualScrollSyncUseCase;
  onScrollState?: (isScrolling: boolean) => void;
}

/**
 * Handler pour les interactions utilisateur (wheel, touch)
 * Fonction pure, testable individuellement
 * 
 * @param event - L'événement utilisateur (optionnel)
 * @param dispatch - La fonction dispatch de Redux
 * @param refs - Les refs nécessaires
 * @param callbacks - Les callbacks nécessaires
 * @param globalPathLength - La longueur globale du path
 * @param isModalOpen - Si la modal est ouverte
 */
export function handleUserInteraction(
  event: Event | undefined,
  dispatch: AppDispatch,
  refs: HandleUserInteractionRefs,
  callbacks: HandleUserInteractionCallbacks,
  globalPathLength: number,
  isModalOpen: boolean
): void {
  if (!isBrowser()) return;
  if (isModalOpen) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[handleUserInteraction] Modal ouverte, ignoré');
    }
    return;
  }

  // Accepter globalPathLength même s'il est à DEFAULT_PATH_LENGTH (valeur par défaut)
  // mais bloquer si vraiment invalide (<= 0)
  if (!isValidPathLength(globalPathLength, true)) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[handleUserInteraction] globalPathLength invalide:', globalPathLength);
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[handleUserInteraction] Event:', event?.type, 'scrollY:', window.scrollY);
  }

  // Gérer l'initialisation et la mise à jour de la vélocité de manière centralisée
  callbacks.handleInitializationAndVelocity(event);

  // Ignorer les touches sur éléments interactifs (boutons, etc.)
  if (event && event.type.startsWith('touch')) {
    const touchEvent = event as TouchEvent;
    const target = touchEvent.target as HTMLElement;
    if (isInteractiveElement(target)) {
      return; // Ne pas mettre en pause l'autoplay
    }
  }

  // Mettre en pause l'autoplay si actif
  if (refs.isAutoPlayingRef.current) {
    refs.isAutoPlayingRef.current = false;
    dispatch(setAutoPlaying(false));
  }

  if (callbacks.onScrollState) {
    callbacks.onScrollState(true);
  }

  callbacks.getUseCase().updateLastScrollTime();

  // OPTIMISATION: Détecter l'arrêt du scroll avec setTimeout au lieu d'un RAF continu
  callbacks.scheduleScrollEndCheck();

  // Programmer la mise à jour via RAF
  if (!refs.pendingUpdateRef.current) {
    refs.pendingUpdateRef.current = true;
    refs.rafIdRef.current = requestAnimationFrame(() => {
      refs.scrollYRef.current = window.scrollY;
      callbacks.processScrollUpdate();
    });
  }
}

