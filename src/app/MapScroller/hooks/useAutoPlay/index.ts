import { useRef, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  setProgress,
  setAutoScrollTemporarilyPaused,
  setIsScrolling,
  setLastScrollDirection,
} from '@/store/scrollSlice';
import { useRafLoop } from '@/hooks/useRafLoop';
import { SCROLL_CONFIG, type AutoScrollDirection } from '@/config';
import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';
import { createPathDomain } from '@/templating/domains/path';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { AutoPlayUseCase } from './application/AutoPlayUseCase';
import { AutoPlayProgressService } from './domain/AutoPlayProgressService';
import { AutoPlayPauseService } from './domain/AutoPlayPauseService';
import { AutoPlayAnchorDetector } from './domain/AutoPlayAnchorDetector';

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
    const progressService = new AutoPlayProgressService();
    const pauseService = new AutoPlayPauseService();
    const anchorDetector = new AutoPlayAnchorDetector(pathDomain);
    useCaseRef.current = new AutoPlayUseCase(progressService, pauseService, anchorDetector);
  }

  // Refs pour la gestion de l'état
  const isPausedRef = useRef(false);
  const lastPausedAnchorIdRef = useRef<string | null>(null);
  const lastPausedTimeRef = useRef<Map<string, number>>(new Map()); // Map<anchorId, timestamp>
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animateRef = useRef<FrameRequestCallback | null>(null);
  const isAutoPlayingRef = useRef(isAutoPlaying);

  // Synchronisation des refs
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  useEffect(() => {
    isAutoPlayingRef.current = isAutoPlaying;
  }, [isAutoPlaying]);

  // Fonction pour vérifier si on peut faire une pause sur un anchor (cooldown de 5 secondes)
  // Mémoïsée en dehors de animate pour éviter la recréation à chaque frame
  const canPauseOnAnchor = useCallback((anchorId: string | undefined): boolean => {
    if (!anchorId) return false;
    const lastPausedTime = lastPausedTimeRef.current.get(anchorId);
    if (!lastPausedTime) return true; // Jamais pausé sur cet anchor
    const timeSinceLastPause = performance.now() - lastPausedTime;
    return timeSinceLastPause >= 5000; // 5 secondes
  }, []);

  // Fonction d'animation
  const animate = useCallback(() => {
    // Ne pas animer si modal ouverte
    if (isModalOpen) return;

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
    if (result.shouldPause && result.anchorId && result.pauseDuration && canPauseOnAnchor(result.anchorId)) {
      isPausedRef.current = true;
      lastPausedAnchorIdRef.current = result.anchorId;
      
      // Enregistrer le temps de pause pour ce anchor (cooldown de 5 secondes)
      lastPausedTimeRef.current.set(result.anchorId, performance.now());
      
      dispatch(setAutoScrollTemporarilyPaused(true));

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        isPausedRef.current = false;
        dispatch(setAutoScrollTemporarilyPaused(false));

        // Reprendre l'animation normalement, sans bump
        // Le cooldown de 5 secondes empêchera la redétection de l'anchor
        if (animateRef.current) {
          start(animateRef.current);
        }
      }, result.pauseDuration);

      return;
    }

    // Réinitialiser la pause si on n'est plus sur un anchor
    if (!result.shouldPause) {
      lastPausedAnchorIdRef.current = null;
      dispatch(setAutoScrollTemporarilyPaused(false));
    }

    // Synchroniser la position de scroll
    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLengthRef.current);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
    const targetScrollY = calculateScrollYFromProgress(result.newProgress, maxScroll);
    
    // window.scrollTo() ne déclenche pas les événements wheel/touch, donc useManualScrollSync
    // ne détectera pas ce scroll comme manuel (on écoute uniquement wheel/touch pour les scrolls manuels)
    window.scrollTo({ top: targetScrollY, behavior: 'auto' });
  }, [autoScrollDirection, dispatch, start, isDesktop, isModalOpen, canPauseOnAnchor]);

  // Stocker la référence de animate et mettre à jour useRafLoop si la boucle est active
  useEffect(() => {
    animateRef.current = animate;
    // Si l'autoplay est actif, mettre à jour le callback dans useRafLoop
    // useRafLoop.start() met toujours à jour cbRef.current, même si la boucle est déjà en cours
    // Cela permet de changer la direction sans mettre en pause l'autoplay
    if (isAutoPlaying) {
      start(animate);
    }
  }, [animate, isAutoPlaying, start]);

  // Démarrer/arrêter l'autoplay
  const startAutoPlay = useCallback(() => {
    // Réinitialiser les états de pause pour permettre le redémarrage
    isPausedRef.current = false;
    lastPausedAnchorIdRef.current = null;
    dispatch(setIsScrolling(true));
    dispatch(setAutoScrollTemporarilyPaused(false));
    stop();
    start(animate);
  }, [start, stop, animate, dispatch]);

  const stopAutoPlay = useCallback(() => {
    dispatch(setIsScrolling(false));
    stop();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [stop, dispatch]);

  // Cleanup des timeouts au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return { startAutoPlay, stopAutoPlay };
}

