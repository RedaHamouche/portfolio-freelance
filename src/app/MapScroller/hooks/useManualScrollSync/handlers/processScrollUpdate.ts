import { setProgress } from '@/store/scrollSlice';
import type { AppDispatch } from '@/store';
import type { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import type { ScrollContextType } from '../../../contexts/ScrollContext';

/**
 * Interface pour les refs nécessaires à processScrollUpdate
 */
export interface ProcessScrollUpdateRefs {
  isInitializedRef: { current: boolean };
  lastInitializedPathLengthRef: { current: number };
  scrollYRef: { current: number };
  pendingUpdateRef: { current: boolean };
  rafIdRef: { current: number | null };
  isAutoPlayingRef: { current: boolean };
  lastScrollDirectionRef: { current: string | null };
}

/**
 * Interface pour les callbacks nécessaires à processScrollUpdate
 */
export interface ProcessScrollUpdateCallbacks {
  initializeUseCase: (pathLength: number, progress?: number) => void;
  getUseCase: () => ManualScrollSyncUseCase;
  startEasingLoop: () => void;
  updateScrollDirectionCallback: (useCase: ManualScrollSyncUseCase) => void;
}

/**
 * Traite la mise à jour du scroll
 * Fonction pure, testable individuellement
 * 
 * @param context - Le contexte de scroll avec les services
 * @param dispatch - La fonction dispatch de Redux
 * @param refs - Les refs nécessaires
 * @param callbacks - Les callbacks nécessaires
 * @param globalPathLength - La longueur globale du path
 * @param isModalOpen - Si la modal est ouverte
 */
export function processScrollUpdate(
  context: ScrollContextType,
  dispatch: AppDispatch,
  refs: ProcessScrollUpdateRefs,
  callbacks: ProcessScrollUpdateCallbacks,
  globalPathLength: number,
  isModalOpen: boolean
): void {
  if (typeof window === 'undefined') return;
  if (isModalOpen) {
    refs.rafIdRef.current = null;
    refs.pendingUpdateRef.current = false;
    return;
  }

  // Accepter globalPathLength même s'il est à DEFAULT_PATH_LENGTH (valeur par défaut)
  // mais bloquer si vraiment invalide (<= 0)
  if (globalPathLength <= 0) {
    refs.rafIdRef.current = null;
    refs.pendingUpdateRef.current = false;
    return;
  }

  // Initialiser si nécessaire
  if (!refs.isInitializedRef.current || refs.lastInitializedPathLengthRef.current !== globalPathLength) {
    refs.scrollYRef.current = window.scrollY;
    callbacks.initializeUseCase(globalPathLength);
  }

  refs.scrollYRef.current = window.scrollY;
  const useCase = callbacks.getUseCase();

  // OPTIMISATION: Mettre à jour la vélocité seulement si activée
  if (context.velocityConfig.enabled) {
    useCase.updateVelocity(refs.scrollYRef.current);
  }

  const result = useCase.updateScrollPosition(refs.scrollYRef.current, globalPathLength);

  if (result.shouldCorrect && result.correctionY !== undefined) {
    window.scrollTo(0, result.correctionY);
  }

  const newProgress = useCase.getCurrentProgress();
  dispatch(setProgress(newProgress));

  // Tracker la direction seulement si l'autoplay n'est pas actif et si elle a changé
  callbacks.updateScrollDirectionCallback(useCase);

  callbacks.startEasingLoop();
  refs.rafIdRef.current = null;
  refs.pendingUpdateRef.current = false;
}

