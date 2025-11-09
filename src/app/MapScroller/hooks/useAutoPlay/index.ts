import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  setProgress,
  setIsScrolling,
  setLastScrollDirection,
} from '@/store/scrollSlice';
import { useRafLoop } from '@/hooks/useRafLoop';
import { SCROLL_CONFIG, type AutoScrollDirection } from '@/config';
import { createPathDomain } from '@/templating/domains/path';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { AutoPlayUseCase } from './application/AutoPlayUseCase';
import { useAutoPlayStateRefs } from './useAutoPlayStateRefs';
import { createAutoPlayUseCase } from './utils/createAutoPlayUseCase';
import { canPauseOnAnchor } from './utils/canPauseOnAnchor';
import { handlePauseOnAnchor } from './actions/handlePauseOnAnchor';
import { clearPauseTimeout } from './actions/clearPauseTimeout';
import { resetPauseState } from './actions/resetPauseState';
import { syncScrollPosition } from './actions/syncScrollPosition';

// ============================================================================
// Hook principal
// ============================================================================

/**
 * Hook pour gérer l'autoplay avec architecture DDD
 * Découplé de l'UI (bouton), utilise Redux pour l'état
 */
export function useAutoPlay({
  globalPathLength,
  progress,
}: {
  globalPathLength: number;
  progress: number;
}) {
  const dispatch = useDispatch();
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection) as AutoScrollDirection;
  const isModalOpen = useSelector((state: RootState) => state.modal.isOpen);

  const { start, stop } = useRafLoop();
  const isDesktop = useBreakpoint('>=desktop');
  const pathDomain = useMemo(() => createPathDomain(), []);

  // Créer les services de domaine et le use case (mémoïsés)
  const useCaseRef = useRef<AutoPlayUseCase | null>(null);
  if (!useCaseRef.current) {
    useCaseRef.current = createAutoPlayUseCase(pathDomain);
  }

  // REFACTORING: Regrouper toutes les refs dans un hook personnalisé pour améliorer l'organisation
  // Le hook gère automatiquement la synchronisation des refs avec les valeurs actuelles
  const {
    isPausedRef,
    lastPausedAnchorIdRef,
    lastPausedTimeRef,
    progressRef,
    globalPathLengthRef,
    timeoutRef,
    timeoutIdRef,
    animateRef,
    isAutoPlayingRef,
    isModalOpenRef,
  } = useAutoPlayStateRefs(isAutoPlaying, isModalOpen, progress, globalPathLength);

  // CRITIQUE: Nettoyer le timeout de pause quand la direction change
  // Cela évite les conflits quand on change de direction et qu'on repasse par le même anchor
  useEffect(() => {
    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, dispatch);
  }, [
    autoScrollDirection,
    dispatch,
    // Les refs (isPausedRef, lastPausedAnchorIdRef, timeoutIdRef, timeoutRef) sont stables
    isPausedRef,
    lastPausedAnchorIdRef,
    timeoutIdRef,
    timeoutRef,
  ]);

  // Fonction pour vérifier si on peut faire une pause sur un anchor (cooldown de 5 secondes)
  // Mémoïsée en dehors de animate pour éviter la recréation à chaque frame
  const canPauseOnAnchorCallback = useCallback((anchorId: string | undefined): boolean => {
    return canPauseOnAnchor(anchorId, lastPausedTimeRef);
  }, [lastPausedTimeRef]);

  // Fonction d'animation
  const animate = useCallback(() => {
    // CRITIQUE: Vérifier isAutoPlayingRef AVANT toute autre chose pour éviter les race conditions
    // Si l'autoplay a été annulé (par exemple par un clic sur PointTrail), on ne doit pas continuer
    if (!isAutoPlayingRef.current) return;
    
    // Ne pas animer si modal ouverte (utiliser la ref pour éviter les dépendances)
    if (isModalOpenRef.current) return;

    const dt = SCROLL_CONFIG.FRAME_DELAY / 1000; // approx 60fps
    const currentProgress = progressRef.current;

    // Utiliser le use case pour calculer le prochain progress
    // Utiliser isAutoPlayingRef pour avoir la valeur à jour même dans le callback
    const result = useCaseRef.current!.animate({
      isAutoPlaying: isAutoPlayingRef.current,
      currentProgress,
      direction: autoScrollDirection,
      dt,
      isDesktop,
      isPaused: isPausedRef.current,
      lastPausedAnchorId: lastPausedAnchorIdRef.current,
    });

    if (!result) return;

    // Tracker la direction du scroll
    const direction = autoScrollDirection > 0 ? 'forward' : 'backward';
    dispatch(setLastScrollDirection(direction));

    // Mettre à jour le progress
    dispatch(setProgress(result.newProgress));

    // Gérer la pause si nécessaire (seulement si le cooldown de 5 secondes est passé)
    if (result.shouldPause && result.anchorId && result.pauseDuration && canPauseOnAnchorCallback(result.anchorId)) {
      handlePauseOnAnchor(
        result.anchorId,
        result.pauseDuration,
        lastPausedTimeRef,
        isPausedRef,
        lastPausedAnchorIdRef,
        timeoutRef,
        timeoutIdRef,
        isModalOpenRef,
        isAutoPlayingRef,
        animateRef,
        start,
        dispatch
      );
      return;
    }

    // Réinitialiser la pause si on n'est plus sur un anchor
    resetPauseState(result.shouldPause, lastPausedAnchorIdRef, dispatch);

    // Synchroniser la position de scroll
    syncScrollPosition(result.newProgress, globalPathLengthRef.current, isModalOpenRef.current);
  }, [
    autoScrollDirection,
    dispatch,
    start,
    isDesktop,
    canPauseOnAnchorCallback,
    // Les refs (animateRef, globalPathLengthRef, isAutoPlayingRef, isModalOpenRef, isPausedRef, lastPausedAnchorIdRef, lastPausedTimeRef, progressRef, timeoutIdRef, timeoutRef) sont stables
    animateRef,
    globalPathLengthRef,
    isAutoPlayingRef,
    isModalOpenRef,
    isPausedRef,
    lastPausedAnchorIdRef,
    lastPausedTimeRef,
    progressRef,
    timeoutIdRef,
    timeoutRef,
  ]);

  // Nettoyer le timeout de pause quand la modal s'ouvre
  useEffect(() => {
    if (isModalOpen) {
      clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, dispatch);
    }
  }, [
    isModalOpen,
    dispatch,
    // Les refs (isPausedRef, lastPausedAnchorIdRef, timeoutIdRef, timeoutRef) sont stables
    isPausedRef,
    lastPausedAnchorIdRef,
    timeoutIdRef,
    timeoutRef,
  ]);

  // Stocker la référence de animate et mettre à jour useRafLoop si la boucle est active
  useEffect(() => {
    animateRef.current = animate;
    // Note: isAutoPlayingRef est synchronisé automatiquement par useAutoPlayStateRefs
    
    // Si l'autoplay est actif et la modal n'est pas ouverte, mettre à jour le callback dans useRafLoop
    // useRafLoop.start() met toujours à jour cbRef.current, même si la boucle est déjà en cours
    // Cela permet de changer la direction sans mettre en pause l'autoplay
    if (isAutoPlaying && !isModalOpen) {
      start(animate);
    } else {
      // CRITIQUE: Arrêter l'animation si isAutoPlaying devient false OU si la modal s'ouvre
      // Cela évite les race conditions où animate() pourrait s'exécuter après l'annulation
      stop();
    }
  }, [
    animate,
    isAutoPlaying,
    isModalOpen,
    start,
    stop,
    // Les refs (animateRef, isAutoPlayingRef) sont stables et synchronisées automatiquement
    animateRef,
    isAutoPlayingRef,
  ]);

  // Démarrer/arrêter l'autoplay
  const startAutoPlay = useCallback(() => {
    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, dispatch);
    dispatch(setIsScrolling(true));
    stop();
    
    // Ne pas démarrer si la modal est ouverte
    if (isModalOpenRef.current) {
      return;
    }
    
    start(animate);
  }, [
    start,
    stop,
    animate,
    dispatch,
    // Les refs (isModalOpenRef, isPausedRef, lastPausedAnchorIdRef, timeoutIdRef, timeoutRef) sont stables
    isModalOpenRef,
    isPausedRef,
    lastPausedAnchorIdRef,
    timeoutIdRef,
    timeoutRef,
  ]);

  const stopAutoPlay = useCallback(() => {
    dispatch(setIsScrolling(false));
    stop();
    clearPauseTimeout(timeoutRef, timeoutIdRef, isPausedRef, lastPausedAnchorIdRef, dispatch);
  }, [
    stop,
    dispatch,
    // Les refs (isPausedRef, lastPausedAnchorIdRef, timeoutIdRef, timeoutRef) sont stables
    isPausedRef,
    lastPausedAnchorIdRef,
    timeoutIdRef,
    timeoutRef,
  ]);

  // Cleanup des timeouts au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    // La ref (timeoutRef) est stable
    timeoutRef,
  ]);

  return { startAutoPlay, stopAutoPlay };
}

