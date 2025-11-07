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
  const timeoutIdRef = useRef<number>(0); // ID unique pour chaque timeout (protection contre les redémarrages rapides)
  const animateRef = useRef<FrameRequestCallback | null>(null);
  const isAutoPlayingRef = useRef(isAutoPlaying);
  const isModalOpenRef = useRef(isModalOpen);

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

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // CRITIQUE: Nettoyer le timeout de pause quand la direction change
  // Cela évite les conflits quand on change de direction et qu'on repasse par le même anchor
  useEffect(() => {
    // Nettoyer le timeout de pause pour éviter les conflits lors du changement de direction
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Invalider le timeout actuel en incrémentant l'ID
    timeoutIdRef.current += 1;
    
    // Réinitialiser les états de pause pour permettre une nouvelle pause dans la nouvelle direction
    isPausedRef.current = false;
    lastPausedAnchorIdRef.current = null;
    dispatch(setAutoScrollTemporarilyPaused(false));
  }, [autoScrollDirection, dispatch]);

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
      
      // Stocker l'anchorId actuel pour vérifier qu'il n'a pas changé quand le timeout se déclenche
      const currentAnchorId = result.anchorId;
      
      // Générer un ID unique pour ce timeout (protection contre les redémarrages rapides)
      timeoutIdRef.current += 1;
      const currentTimeoutId = timeoutIdRef.current;
      
      timeoutRef.current = setTimeout(() => {
        // CRITIQUE: Vérifier que ce timeout est toujours valide
        // Si timeoutIdRef a changé, cela signifie qu'un nouveau timeout a été créé (redémarrage rapide)
        if (timeoutIdRef.current !== currentTimeoutId) {
          return; // Ce timeout est obsolète, ne rien faire
        }
        
        // Vérifier que la modal n'est pas ouverte avant de reprendre
        if (isModalOpenRef.current) {
          return;
        }
        
        // Vérifier que l'autoplay est toujours actif
        if (!isAutoPlayingRef.current) {
          return;
        }
        
        // Vérifier que l'anchor n'a pas changé (protection contre les redémarrages rapides)
        // Si lastPausedAnchorIdRef a changé, cela signifie qu'on a redémarré l'autoplay
        if (lastPausedAnchorIdRef.current !== currentAnchorId) {
          return; // L'anchor a changé, ne pas reprendre
        }
        
        // Vérifier que isPausedRef est toujours true (sinon on a déjà repris ou redémarré)
        if (!isPausedRef.current) {
          return; // On n'est plus en pause, ne rien faire
        }
        
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
    // Ne pas scroller si la modal est ouverte (évite les conflits avec la restauration du scroll de la modal)
    if (!isModalOpenRef.current) {
      try {
        const fakeScrollHeight = calculateFakeScrollHeight(globalPathLengthRef.current);
        const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
        const targetScrollY = calculateScrollYFromProgress(result.newProgress, maxScroll);
        
        // Valider que targetScrollY est un nombre valide
        if (isNaN(targetScrollY) || !isFinite(targetScrollY)) {
          console.warn(`[useAutoPlay] targetScrollY invalide: ${targetScrollY}, scroll ignoré`);
          return;
        }
        
        // window.scrollTo() ne déclenche pas les événements wheel/touch, donc useManualScrollSync
        // ne détectera pas ce scroll comme manuel (on écoute uniquement wheel/touch pour les scrolls manuels)
        window.scrollTo({ top: targetScrollY, behavior: 'auto' });
      } catch (error) {
        // Gérer les erreurs de window.scrollTo() (peut échouer si la modal est en train de restaurer le scroll)
        console.warn('[useAutoPlay] Erreur lors du scroll:', error);
      }
    }
  }, [autoScrollDirection, dispatch, start, isDesktop, isModalOpen, canPauseOnAnchor]);

  // Nettoyer le timeout de pause quand la modal s'ouvre
  useEffect(() => {
    if (isModalOpen) {
      // CRITIQUE: Nettoyer le timeout de pause pour éviter les conflits
      // Quand la modal s'ouvre, on ne veut pas que le timeout de pause se déclenche
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Invalider le timeout actuel en incrémentant l'ID
      timeoutIdRef.current += 1;
      
      // Réinitialiser les états de pause
      isPausedRef.current = false;
      dispatch(setAutoScrollTemporarilyPaused(false));
    }
  }, [isModalOpen, dispatch]);

  // Stocker la référence de animate et mettre à jour useRafLoop si la boucle est active
  useEffect(() => {
    animateRef.current = animate;
    // Si l'autoplay est actif et la modal n'est pas ouverte, mettre à jour le callback dans useRafLoop
    // useRafLoop.start() met toujours à jour cbRef.current, même si la boucle est déjà en cours
    // Cela permet de changer la direction sans mettre en pause l'autoplay
    if (isAutoPlaying && !isModalOpen) {
      start(animate);
    } else if (isModalOpen) {
      // Si la modal s'ouvre, arrêter l'animation
      stop();
    }
  }, [animate, isAutoPlaying, isModalOpen, start, stop]);

  // Démarrer/arrêter l'autoplay
  const startAutoPlay = useCallback(() => {
    // Nettoyer les timeouts précédents pour éviter les conflits
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Invalider le timeout actuel en incrémentant l'ID (protection contre les redémarrages rapides)
    // Cela empêche les timeouts obsolètes de se déclencher
    timeoutIdRef.current += 1;
    
    // Réinitialiser les états de pause pour permettre le redémarrage
    isPausedRef.current = false;
    lastPausedAnchorIdRef.current = null;
    dispatch(setIsScrolling(true));
    dispatch(setAutoScrollTemporarilyPaused(false));
    stop();
    
    // Ne pas démarrer si la modal est ouverte
    if (isModalOpenRef.current) {
      return;
    }
    
    start(animate);
  }, [start, stop, animate, dispatch]);

  const stopAutoPlay = useCallback(() => {
    dispatch(setIsScrolling(false));
    stop();
    
    // CRITIQUE: Nettoyer tous les états de pause pour éviter les conflits lors de redémarrages rapides
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Invalider le timeout actuel en incrémentant l'ID (protection contre les redémarrages rapides)
    timeoutIdRef.current += 1;
    
    // Réinitialiser les états de pause pour éviter les conflits
    isPausedRef.current = false;
    lastPausedAnchorIdRef.current = null;
    dispatch(setAutoScrollTemporarilyPaused(false));
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

