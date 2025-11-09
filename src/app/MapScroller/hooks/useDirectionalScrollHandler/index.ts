import { useCallback, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useRafLoop } from '@/hooks/useRafLoop';
import { type ScrollDirection } from '@/config';
import { DirectionalScrollUseCase } from './application/DirectionalScrollUseCase';
import { useDirectionalScrollStateRefs } from './useDirectionalScrollStateRefs';
import { updateProgress } from './actions/updateProgress';
import { startDirectionalScroll as startDirectionalScrollAction } from './actions/startDirectionalScroll';
import { stopDirectionalScroll as stopDirectionalScrollAction } from './actions/stopDirectionalScroll';
import { ProgressUpdateService } from '../../services/ProgressUpdateService';

/**
 * Hook pour gérer le scroll directionnel (clavier/boutons)
 * Architecture DDD alignée avec useAutoPlay
 */
export function useDirectionalScrollHandler({
  direction,
  speed,
  globalPathLength,
  progress
}: {
  direction: ScrollDirection,
  speed: number,
  globalPathLength: number,
  progress: number
}) {
  const dispatch = useDispatch();
  const { start, stop } = useRafLoop();
  
  // Service pour mettre à jour le progress (source unique de vérité)
  const progressUpdateService = useMemo(() => new ProgressUpdateService(dispatch), [dispatch]);
  
  // Use case (créé une seule fois)
  const useCaseRef = useRef<DirectionalScrollUseCase | null>(null);
  if (!useCaseRef.current) {
    useCaseRef.current = new DirectionalScrollUseCase();
  }

  // REFACTORING: Regrouper toutes les refs dans un hook personnalisé
  const { progressRef, globalPathLengthRef } = useDirectionalScrollStateRefs(progress, globalPathLength);

  // Fonction d'animation
  const animate = useCallback(() => {
    if (!direction) return;

    const result = useCaseRef.current!.animate({
      direction,
      speed,
      currentProgress: progressRef.current,
      globalPathLength: globalPathLengthRef.current,
    });

    if (!result) return;

    // Mettre à jour le progress et la direction (source unique de vérité)
    updateProgress(result.newProgress, result.scrollDirection, progressUpdateService);
  }, [direction, speed, progressUpdateService, progressRef, globalPathLengthRef]);

  // Stocker la référence de animate
  const animateRef = useRef<FrameRequestCallback | null>(null);
  animateRef.current = animate;

  const startDirectionalScroll = useCallback(() => {
    if (!direction) return;
    startDirectionalScrollAction(dispatch, start, animate);
  }, [direction, start, animate, dispatch]);

  const stopDirectionalScroll = useCallback(() => {
    stopDirectionalScrollAction(dispatch, stop);
  }, [stop, dispatch]);

  return { startDirectionalScroll, stopDirectionalScroll };
} 