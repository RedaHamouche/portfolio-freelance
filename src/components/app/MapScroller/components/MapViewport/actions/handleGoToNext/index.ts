import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll, calculateAdjustedTargetProgress } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';
import { syncScrollPosition } from '@/utils/scrollUtils/syncScrollPosition';

export interface HandleGoToNextParams {
  nextComponent: {
    position: {
      progress: number;
    };
  } | null;
  globalPathLength: number;
  progress: number;
  lastScrollDirection: string | null;
  isAutoPlaying: boolean;
  isModalOpen: boolean;
  setAutoPlaying: (isPlaying: boolean) => void;
}

/**
 * Action pour gérer le clic sur PointTrail (aller au prochain composant)
 * Fonction pure, testable individuellement
 */
export function handleGoToNext(params: HandleGoToNextParams): void {
  const {
    nextComponent,
    globalPathLength,
    progress,
    lastScrollDirection,
    isAutoPlaying,
    isModalOpen,
    setAutoPlaying,
  } = params;

  if (!nextComponent) return;
  if (typeof window === 'undefined') return;

  // CRITIQUE: Annuler l'autoplay si actif (même si on clique sur PointTrail pendant l'autoplay)
  // Cela permet à l'utilisateur de reprendre le contrôle en cliquant sur PointTrail
  if (isAutoPlaying) {
    setAutoPlaying(false);
  }

  // Utiliser requestAnimationFrame pour s'assurer que les dimensions sont stables
  // Cela évite les problèmes sur iOS où window.innerHeight peut changer
  requestAnimationFrame(() => {
    // Utiliser getViewportHeight() pour être cohérent avec le reste de l'application
    // Cette fonction utilise window.innerHeight de manière stable
    const viewportHeight = getViewportHeight();
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, viewportHeight);
    
    // Calculer le target progress en respectant toujours la direction du PointTrail
    // Le PointTrail pointe déjà dans la bonne direction grâce à findNextComponentInDirection
    const adjustedTargetProgress = calculateAdjustedTargetProgress(
      progress,
      nextComponent.position.progress,
      lastScrollDirection
    );
    
    // Utiliser l'utilitaire centralisé pour synchroniser le scroll (source unique de vérité)
    syncScrollPosition(adjustedTargetProgress, globalPathLength, isModalOpen, {
      behavior: 'smooth',
      logPrefix: '[MapViewport]',
    });
  });
}

