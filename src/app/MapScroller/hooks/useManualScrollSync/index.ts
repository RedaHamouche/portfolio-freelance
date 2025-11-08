import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setProgress, setLastScrollDirection, setAutoPlaying, setAutoScrollDirection } from '@/store/scrollSlice';
import { ManualScrollSyncUseCase } from './application/ManualScrollSyncUseCase';
import { ScrollEasingService, EasingFunctions } from './domain/ScrollEasingService';
import { ScrollProgressCalculator } from './domain/ScrollProgressCalculator';
import { ScrollStateDetector } from './domain/ScrollStateDetector';
import { ScrollVelocityService } from './domain/ScrollVelocityService';
import { SCROLL_INERTIA_FACTOR, SCROLL_EASING_TYPE, SCROLL_EASING_MIN_DELTA, SCROLL_VELOCITY_CONFIG, SCROLL_CONFIG, DEFAULT_PATH_LENGTH } from '@/config';
import { createPathDomain } from '@/templating/domains/path';
import { ProgressInitializationService } from '../useScrollInitialization/domain/ProgressInitializationService';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { useScrollStateRefs } from './useScrollStateRefs';

/**
 * Hook pour synchroniser le scroll manuel avec le progress
 * Implémentation simple basée sur les tests Gherkin
 */
export function useManualScrollSync(
  globalPathLength: number,
  onScrollState?: (isScrolling: boolean) => void,
  isScrollSynced: boolean = true
) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: RootState) => state.modal.isOpen);
  const currentProgress = useSelector((state: RootState) => state.scroll.progress);
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);

  // Utiliser le même hook que useScrollInitialization pour garantir la cohérence
  const isDesktop = useBreakpoint('>=desktop');

  // Services pour calculer le progress depuis le hash (service centralisé)
  const pathDomain = useMemo(() => createPathDomain(), []);
  const progressInitService = useMemo(() => new ProgressInitializationService(), []);

  // Configuration de vélocité selon mobile/desktop
  const velocityConfig = useMemo(() => {
    const config = isDesktop ? SCROLL_VELOCITY_CONFIG.desktop : SCROLL_VELOCITY_CONFIG.mobile;
    return {
      enabled: SCROLL_VELOCITY_CONFIG.enabled,
      ...config,
    };
  }, [isDesktop]);

  // Services de domaine (mémoïsés)
  const easingFunction = useMemo(() => {
    return EasingFunctions[SCROLL_EASING_TYPE] || EasingFunctions.linear;
  }, []);
  
  const easingService = useMemo(() => new ScrollEasingService(
    SCROLL_INERTIA_FACTOR,
    easingFunction,
    SCROLL_EASING_MIN_DELTA
  ), [easingFunction]);
  
  const progressCalculator = useMemo(() => new ScrollProgressCalculator(), []);
  const stateDetector = useMemo(() => new ScrollStateDetector(150), []);
  const velocityService = useMemo(() => new ScrollVelocityService(
    velocityConfig.friction,
    velocityConfig.maxVelocity
  ), [velocityConfig.friction, velocityConfig.maxVelocity]);

  // Use case (créé une seule fois, jamais null après création)
  const useCaseRef = useRef<ManualScrollSyncUseCase | null>(null);
  if (!useCaseRef.current) {
    useCaseRef.current = new ManualScrollSyncUseCase(
      easingService,
      progressCalculator,
      stateDetector,
      velocityService,
      velocityConfig
    );
  }
  
  // Fonction helper pour s'assurer que useCaseRef est toujours disponible
  const getUseCase = useCallback((): ManualScrollSyncUseCase => {
    if (!useCaseRef.current) {
      useCaseRef.current = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig
      );
    }
    return useCaseRef.current;
  }, [easingService, progressCalculator, stateDetector, velocityService, velocityConfig]);

  // REFACTORING: Regrouper toutes les refs dans un hook personnalisé pour améliorer l'organisation
  const {
    isInitializedRef,
    lastInitializedPathLengthRef,
    scrollYRef,
    scrollEndTimeoutRef,
    rafIdRef,
    pendingUpdateRef,
    easingRafIdRef,
    isEasingActiveRef,
    isAutoPlayingRef,
    prevIsAutoPlayingRef,
    lastScrollDirectionRef,
  } = useScrollStateRefs(isAutoPlaying);

  // REFACTORING: Fonction centralisée pour initialiser le useCase
  // Évite la duplication de code dans handleUserInteraction, handleScroll et useEffect
  const initializeUseCase = useCallback((pathLength: number, progress?: number) => {
    try {
      getUseCase().initialize(pathLength, progress);
      lastInitializedPathLengthRef.current = pathLength;
      isInitializedRef.current = true;
    } catch (error) {
      console.error('[useManualScrollSync] Erreur lors de l\'initialisation:', error);
      // Recréer le useCase en cas d'erreur
      useCaseRef.current = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig
      );
      useCaseRef.current.initialize(pathLength, progress);
      lastInitializedPathLengthRef.current = pathLength;
      isInitializedRef.current = true;
    }
  }, [
    getUseCase,
    easingService,
    progressCalculator,
    stateDetector,
    velocityService,
    velocityConfig,
    // Les refs (isInitializedRef, lastInitializedPathLengthRef) sont stables et n'ont pas besoin d'être dans les dépendances
    isInitializedRef,
    lastInitializedPathLengthRef,
  ]);

  // REFACTORING: Fonction centralisée pour mettre à jour la direction du scroll
  // Évite la duplication de code dans easingLoop et processScrollUpdate
  const updateScrollDirection = useCallback((useCase: ManualScrollSyncUseCase) => {
    if (isAutoPlayingRef.current) return;
    
    const direction = useCase.getScrollDirection();
    if (direction && direction !== lastScrollDirectionRef.current) {
      lastScrollDirectionRef.current = direction;
      dispatch(setLastScrollDirection(direction));
      const autoScrollDirection = direction === 'forward' ? 1 : -1;
      dispatch(setAutoScrollDirection(autoScrollDirection));
    }
  }, [
    dispatch,
    // Les refs (isAutoPlayingRef, lastScrollDirectionRef) sont stables et n'ont pas besoin d'être dans les dépendances
    isAutoPlayingRef,
    lastScrollDirectionRef,
  ]);

  // REFACTORING: Fonction centralisée pour détecter si on doit réinitialiser à cause d'un changement de pathLength
  // Évite la duplication de code et rend la logique testable
  const shouldReinitializeForPathLength = useCallback((currentPathLength: number): boolean => {
    const pathLengthChanged = lastInitializedPathLengthRef.current !== currentPathLength;
    const wasDefaultValue = lastInitializedPathLengthRef.current <= DEFAULT_PATH_LENGTH;
    const isRealValue = currentPathLength > DEFAULT_PATH_LENGTH;
    
    return pathLengthChanged && wasDefaultValue && isRealValue && isInitializedRef.current;
  }, [
    // Les refs (lastInitializedPathLengthRef, isInitializedRef) sont stables et n'ont pas besoin d'être dans les dépendances
    lastInitializedPathLengthRef,
    isInitializedRef,
  ]);

  // REFACTORING: Fonction centralisée pour programmer la vérification de fin de scroll
  // Évite la duplication de code dans handleUserInteraction et handleScroll
  const scheduleScrollEndCheck = useCallback(() => {
    // Annuler le timeout précédent si présent
    if (scrollEndTimeoutRef.current !== null) {
      clearTimeout(scrollEndTimeoutRef.current);
      scrollEndTimeoutRef.current = null;
    }

    // Programmer la vérification après SCROLL_END_DELAY (150ms)
    scrollEndTimeoutRef.current = setTimeout(() => {
      const isEnded = getUseCase().checkScrollEnd();
      if (isEnded && onScrollState) {
        onScrollState(false);
      }
      scrollEndTimeoutRef.current = null;
    }, SCROLL_CONFIG.SCROLL_END_DELAY);
  }, [
    getUseCase,
    onScrollState,
    // La ref (scrollEndTimeoutRef) est stable et n'a pas besoin d'être dans les dépendances
    scrollEndTimeoutRef,
  ]);

  // REFACTORING: Fonction centralisée pour détecter si un élément est interactif
  // Évite la duplication et rend la logique testable
  const isInteractiveElement = useCallback((target: HTMLElement | null): boolean => {
    if (!target) return false;
    
    return (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      !!target.closest('button') ||
      !!target.closest('input') ||
      !!target.closest('select') ||
      !!target.closest('textarea') ||
      !!target.closest('[role="button"]')
    );
  }, []);

  // REFACTORING: Fonction centralisée pour gérer l'initialisation et la mise à jour de la vélocité
  // Évite la duplication entre handleUserInteraction et handleScroll
  const handleInitializationAndVelocity = useCallback((event?: Event) => {
    // Initialiser si nécessaire
    if (!isInitializedRef.current || lastInitializedPathLengthRef.current !== globalPathLength) {
      scrollYRef.current = window.scrollY;
      initializeUseCase(globalPathLength);
    }

    // OPTIMISATION: Capturer la vélocité depuis l'événement wheel seulement si activée
    if (event && event.type === 'wheel' && velocityConfig.enabled) {
      const wheelEvent = event as WheelEvent;
      getUseCase().updateVelocityFromWheel(wheelEvent.deltaY);
    }

    // Mettre à jour scrollYRef et la vélocité
    scrollYRef.current = window.scrollY;
    if (velocityConfig.enabled) {
      getUseCase().updateVelocity(scrollYRef.current);
    }
  }, [
    globalPathLength,
    initializeUseCase,
    velocityConfig,
    getUseCase,
    // Les refs (isInitializedRef, lastInitializedPathLengthRef, scrollYRef) sont stables et n'ont pas besoin d'être dans les dépendances
    isInitializedRef,
    lastInitializedPathLengthRef,
    scrollYRef,
  ]);

  // Synchroniser isAutoPlayingRef et détecter les changements de pathLength
  useEffect(() => {
    const wasAutoPlaying = prevIsAutoPlayingRef.current;
    prevIsAutoPlayingRef.current = isAutoPlaying;
    isAutoPlayingRef.current = isAutoPlaying;

    // Si le pathLength a changé de DEFAULT_PATH_LENGTH (défaut) à la vraie valeur, réinitialiser
    // Cela corrige les initialisations qui se sont faites avec le mauvais pathLength
    if (shouldReinitializeForPathLength(globalPathLength)) {
      // Le pathLength est passé de la valeur par défaut à la vraie valeur
      // Réinitialiser le système avec le bon pathLength
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useManualScrollSync] PathLength changé de', lastInitializedPathLengthRef.current, 'à', globalPathLength, '- Réinitialisation');
      }
      scrollYRef.current = window.scrollY;
      initializeUseCase(globalPathLength);
      const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
      dispatch(setProgress(progressResult.progress));
      return; // Ne pas continuer avec la logique autoplay si on vient de réinitialiser
    }

    // Quand l'autoplay s'arrête, réinitialiser pour synchroniser avec window.scrollY
    if (wasAutoPlaying && !isAutoPlaying && typeof window !== 'undefined') {
      scrollYRef.current = window.scrollY;
      initializeUseCase(globalPathLength);
      // Utiliser progressCalculator depuis le scope (mémoïsé, stable)
      const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
      dispatch(setProgress(progressResult.progress));
    }
  }, [
    isAutoPlaying,
    globalPathLength,
    dispatch,
    initializeUseCase,
    shouldReinitializeForPathLength,
    progressCalculator,
    // Les refs (isAutoPlayingRef, lastInitializedPathLengthRef, prevIsAutoPlayingRef, scrollYRef) sont stables
    isAutoPlayingRef,
    lastInitializedPathLengthRef,
    prevIsAutoPlayingRef,
    scrollYRef,
  ]);

  // Boucle d'easing
  const easingLoop = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) {
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
      return;
    }

    const useCase = getUseCase();
    const shouldContinue = useCase.animateEasing();
    const progressFromUseCase = useCase.getCurrentProgress();
    dispatch(setProgress(progressFromUseCase));

    // Tracker la direction seulement si l'autoplay n'est pas actif et si elle a changé
    updateScrollDirection(useCase);

    if (shouldContinue) {
      easingRafIdRef.current = requestAnimationFrame(easingLoop);
    } else {
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
    }
  }, [
    dispatch,
    isModalOpen,
    getUseCase,
    updateScrollDirection,
    // Les refs (easingRafIdRef, isEasingActiveRef) sont stables et n'ont pas besoin d'être dans les dépendances
    easingRafIdRef,
    isEasingActiveRef,
  ]);

  const startEasingLoop = useCallback(() => {
    if (!isEasingActiveRef.current) {
      isEasingActiveRef.current = true;
      easingRafIdRef.current = requestAnimationFrame(easingLoop);
    }
  }, [
    easingLoop,
    // Les refs (easingRafIdRef, isEasingActiveRef) sont stables et n'ont pas besoin d'être dans les dépendances
    easingRafIdRef,
    isEasingActiveRef,
  ]);

  // Traiter la mise à jour du scroll
  const processScrollUpdate = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) {
      rafIdRef.current = null;
      pendingUpdateRef.current = false;
      return;
    }
    // Accepter globalPathLength même s'il est à DEFAULT_PATH_LENGTH (valeur par défaut)
    // mais bloquer si vraiment invalide (<= 0)
    if (globalPathLength <= 0) {
      rafIdRef.current = null;
      pendingUpdateRef.current = false;
      return;
    }

    // Initialiser si nécessaire
    // MAIS: Si le pathLength change de DEFAULT_PATH_LENGTH à la vraie valeur, on se réinitialisera dans le useEffect
    if (!isInitializedRef.current || lastInitializedPathLengthRef.current !== globalPathLength) {
      scrollYRef.current = window.scrollY;
      initializeUseCase(globalPathLength);
    }

    scrollYRef.current = window.scrollY;
    const useCase = getUseCase();
    
    // OPTIMISATION: Mettre à jour la vélocité seulement si activée
    // velocityConfig est mémoïsé et stable, accessible depuis le scope
    if (velocityConfig.enabled) {
      useCase.updateVelocity(scrollYRef.current);
    }
    
    const result = useCase.updateScrollPosition(scrollYRef.current, globalPathLength);

    if (result.shouldCorrect && result.correctionY !== undefined) {
      window.scrollTo(0, result.correctionY);
    }

    const newProgress = useCase.getCurrentProgress();
    dispatch(setProgress(newProgress));

    // Tracker la direction seulement si l'autoplay n'est pas actif et si elle a changé
    updateScrollDirection(useCase);

    startEasingLoop();
    rafIdRef.current = null;
    pendingUpdateRef.current = false;
  }, [
    globalPathLength,
    isModalOpen,
    startEasingLoop,
    dispatch,
    updateScrollDirection,
    initializeUseCase,
    getUseCase,
    velocityConfig,
    // Les refs (isInitializedRef, lastInitializedPathLengthRef, pendingUpdateRef, rafIdRef, scrollYRef) sont stables
    isInitializedRef,
    lastInitializedPathLengthRef,
    pendingUpdateRef,
    rafIdRef,
    scrollYRef,
  ]);

  // Handler pour les interactions utilisateur (wheel, touch)
  const handleUserInteraction = useCallback((event?: Event) => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) return;
    
    // Accepter globalPathLength même s'il est à DEFAULT_PATH_LENGTH (valeur par défaut)
    // mais bloquer si vraiment invalide (<= 0)
    if (globalPathLength <= 0) return;

    // REFACTORING: Gérer l'initialisation et la mise à jour de la vélocité de manière centralisée
    handleInitializationAndVelocity(event);

    // Ignorer les touches sur éléments interactifs (boutons, etc.)
    if (event && event.type.startsWith('touch')) {
      const touchEvent = event as TouchEvent;
      const target = touchEvent.target as HTMLElement;
      if (isInteractiveElement(target)) {
        return; // Ne pas mettre en pause l'autoplay
      }
    }

    // Mettre en pause l'autoplay si actif
    if (isAutoPlayingRef.current) {
      isAutoPlayingRef.current = false;
      dispatch(setAutoPlaying(false));
    }

    if (onScrollState) {
      onScrollState(true);
    }

    getUseCase().updateLastScrollTime();

    // OPTIMISATION: Détecter l'arrêt du scroll avec setTimeout au lieu d'un RAF continu
    scheduleScrollEndCheck();

    // Programmer la mise à jour via RAF
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => {
        scrollYRef.current = window.scrollY;
        processScrollUpdate();
      });
    }
  }, [
    onScrollState,
    isModalOpen,
    processScrollUpdate,
    dispatch,
    globalPathLength,
    scheduleScrollEndCheck,
    handleInitializationAndVelocity,
    isInteractiveElement,
    getUseCase,
    // Les refs (isAutoPlayingRef, pendingUpdateRef, rafIdRef, scrollYRef) sont stables
    isAutoPlayingRef,
    pendingUpdateRef,
    rafIdRef,
    scrollYRef,
  ]);

  // Handler pour l'événement scroll
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) return;
    
    // Accepter globalPathLength même s'il est à DEFAULT_PATH_LENGTH (valeur par défaut)
    // mais bloquer si vraiment invalide (<= 0)
    if (globalPathLength <= 0) return;

    // REFACTORING: Gérer l'initialisation et la mise à jour de la vélocité de manière centralisée
    handleInitializationAndVelocity();

    // Programmer la mise à jour via RAF
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          processScrollUpdate();
        });
      }
    }

    if (onScrollState) {
      onScrollState(true);
    }

    getUseCase().updateLastScrollTime();

    // OPTIMISATION: Détecter l'arrêt du scroll avec setTimeout au lieu d'un RAF continu
    scheduleScrollEndCheck();
  }, [
    isModalOpen,
    processScrollUpdate,
    onScrollState,
    globalPathLength,
    scheduleScrollEndCheck,
    handleInitializationAndVelocity,
    getUseCase,
    // Les refs (pendingUpdateRef, rafIdRef) sont stables
    pendingUpdateRef,
    rafIdRef,
  ]);

  // Event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const touchStartHandler = (e: TouchEvent) => handleUserInteraction(e);
    const touchMoveHandler = (e: TouchEvent) => handleUserInteraction(e);

    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', touchStartHandler, { passive: true });
    window.addEventListener('touchmove', touchMoveHandler, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchstart', touchStartHandler);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (easingRafIdRef.current !== null) {
        cancelAnimationFrame(easingRafIdRef.current);
      }
      // OPTIMISATION: Nettoyer le timeout au lieu du RAF
      if (scrollEndTimeoutRef.current !== null) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, [
    handleUserInteraction,
    handleScroll,
    // Les refs (easingRafIdRef, rafIdRef, scrollEndTimeoutRef) sont stables
    easingRafIdRef,
    rafIdRef,
    scrollEndTimeoutRef,
  ]);

  // Initialisation (seulement si pas déjà initialisé par une interaction utilisateur)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isScrollSynced) return;
    if (isInitializedRef.current) return; // Déjà initialisé par handleUserInteraction ou handleScroll
    // Attendre que la VRAIE longueur du path soit connue (> DEFAULT_PATH_LENGTH)
    // Sinon on s'initialise avec le mauvais pathLength
    if (globalPathLength <= 0 || globalPathLength <= DEFAULT_PATH_LENGTH) return;

    // Ne pas réinitialiser si le progress a déjà été initialisé par useScrollInitialization
    // Si currentProgress n'est pas le default (0.005), c'est qu'il a déjà été initialisé
    scrollYRef.current = window.scrollY;
    const hash = window.location.hash;
    const hasHash = hash && hash.replace('#', '').trim().length > 0;
    
    // pathDomain et progressInitService sont mémoïsés et stables, accessibles depuis le scope
    if (hasHash) {
      // Utiliser le service centralisé pour calculer le progress
      // Règles: anchorID → progress → localStorage → default
      // La logique est identique sur mobile et desktop
      const result = progressInitService.initializeProgress(hash, pathDomain);
      const progressToUse = result.progress;
      initializeUseCase(globalPathLength, progressToUse);
      // Ne pas dispatcher ici car useScrollInitialization l'a déjà fait
    } else {
      // Pas de hash : utiliser currentProgress qui a été initialisé par useScrollInitialization
      // Si currentProgress n'est pas le default (0.005), c'est qu'il a déjà été initialisé
      const progressToUse = currentProgress !== 0.005 && currentProgress > 0 ? currentProgress : undefined;
      initializeUseCase(globalPathLength, progressToUse);
      if (!progressToUse) {
        processScrollUpdate();
      }
    }
  }, [
    isScrollSynced,
    globalPathLength,
    currentProgress,
    processScrollUpdate,
    initializeUseCase,
    pathDomain,
    progressInitService,
    // Les refs (isInitializedRef, scrollYRef) sont stables
    isInitializedRef,
    scrollYRef,
  ]);
}
