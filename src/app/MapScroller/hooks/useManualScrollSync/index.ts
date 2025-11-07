import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setProgress, setLastScrollDirection, setAutoPlaying, setAutoScrollDirection } from '@/store/scrollSlice';
import { ManualScrollSyncUseCase } from './application/ManualScrollSyncUseCase';
import { ScrollEasingService, EasingFunctions } from './domain/ScrollEasingService';
import { ScrollProgressCalculator } from './domain/ScrollProgressCalculator';
import { ScrollStateDetector } from './domain/ScrollStateDetector';
import { ScrollVelocityService } from './domain/ScrollVelocityService';
import { SCROLL_INERTIA_FACTOR, SCROLL_EASING_TYPE, SCROLL_EASING_MIN_DELTA, SCROLL_VELOCITY_CONFIG, BREAKPOINTS } from '@/config';

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

  // Détecter si on est sur mobile ou desktop
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= BREAKPOINTS.desktop;
  });

  // Mettre à jour isDesktop lors du resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.desktop);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Refs
  const isInitializedRef = useRef(false);
  const lastInitializedPathLengthRef = useRef<number>(0); // Track le pathLength utilisé lors de la dernière initialisation
  const scrollYRef = useRef(0);
  const scrollEndRafIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);
  const easingRafIdRef = useRef<number | null>(null);
  const isEasingActiveRef = useRef(false);
  const isAutoPlayingRef = useRef(isAutoPlaying);
  const prevIsAutoPlayingRef = useRef(isAutoPlaying);
  
  // Seuil de changement minimum pour desktop (évite les micro-dispatches sans délai)
  const lastDispatchedProgressRef = useRef<number | null>(null);

  // Synchroniser isAutoPlayingRef et détecter les changements de pathLength
  useEffect(() => {
    const wasAutoPlaying = prevIsAutoPlayingRef.current;
    prevIsAutoPlayingRef.current = isAutoPlaying;
    isAutoPlayingRef.current = isAutoPlaying;

    // CRITIQUE: Si le pathLength a changé de 2000 (défaut) à la vraie valeur, réinitialiser
    // Cela corrige les initialisations qui se sont faites avec le mauvais pathLength
    const pathLengthChanged = lastInitializedPathLengthRef.current !== globalPathLength;
    const wasDefaultValue = lastInitializedPathLengthRef.current <= 2000;
    const isRealValue = globalPathLength > 2000;
    
    if (pathLengthChanged && wasDefaultValue && isRealValue && isInitializedRef.current) {
      // Le pathLength est passé de la valeur par défaut à la vraie valeur
      // Réinitialiser le système avec le bon pathLength
      if (process.env.NODE_ENV !== 'production') {
        console.log('[useManualScrollSync] PathLength changé de', lastInitializedPathLengthRef.current, 'à', globalPathLength, '- Réinitialisation');
      }
      scrollYRef.current = window.scrollY;
      try {
        getUseCase().initialize(globalPathLength);
        const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
        dispatch(setProgress(progressResult.progress));
        lastInitializedPathLengthRef.current = globalPathLength;
      } catch (error) {
        console.error('[useManualScrollSync] Erreur lors de la réinitialisation après changement de pathLength:', error);
        useCaseRef.current = new ManualScrollSyncUseCase(
          easingService,
          progressCalculator,
          stateDetector,
          velocityService,
          velocityConfig
        );
        useCaseRef.current.initialize(globalPathLength);
        lastInitializedPathLengthRef.current = globalPathLength;
      }
      return; // Ne pas continuer avec la logique autoplay si on vient de réinitialiser
    }

    // Quand l'autoplay s'arrête, réinitialiser pour synchroniser avec window.scrollY
    if (wasAutoPlaying && !isAutoPlaying && typeof window !== 'undefined') {
      scrollYRef.current = window.scrollY;
      try {
        getUseCase().initialize(globalPathLength);
        const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
        dispatch(setProgress(progressResult.progress));
        lastInitializedPathLengthRef.current = globalPathLength;
      } catch (error) {
        console.error('[useManualScrollSync] Erreur lors de la réinitialisation après autoplay:', error);
        useCaseRef.current = new ManualScrollSyncUseCase(
          easingService,
          progressCalculator,
          stateDetector,
          velocityService,
          velocityConfig
        );
        useCaseRef.current.initialize(globalPathLength);
        lastInitializedPathLengthRef.current = globalPathLength;
      }
    }
  }, [isAutoPlaying, globalPathLength, dispatch, progressCalculator, getUseCase, easingService, stateDetector, velocityService, velocityConfig]);

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

    // Tracker la direction seulement si l'autoplay n'est pas actif
    if (!isAutoPlayingRef.current) {
      const direction = useCase.getScrollDirection();
      if (direction) {
        dispatch(setLastScrollDirection(direction));
        const autoScrollDirection = direction === 'forward' ? 1 : -1;
        dispatch(setAutoScrollDirection(autoScrollDirection));
      }
    }

    if (shouldContinue) {
      easingRafIdRef.current = requestAnimationFrame(easingLoop);
    } else {
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
    }
  }, [dispatch, isModalOpen, getUseCase]);

  // TEMPORAIRE : Désactivé pour diagnostic
  // const startEasingLoop = useCallback(() => {
  //   if (!isEasingActiveRef.current) {
  //     isEasingActiveRef.current = true;
  //     easingRafIdRef.current = requestAnimationFrame(easingLoop);
  //   }
  // }, [easingLoop]);

  // Traiter la mise à jour du scroll
  const processScrollUpdate = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) {
      rafIdRef.current = null;
      pendingUpdateRef.current = false;
      return;
    }
    // Accepter globalPathLength même s'il est à 2000 (valeur par défaut)
    // mais bloquer si vraiment invalide (<= 0)
    if (globalPathLength <= 0) {
      rafIdRef.current = null;
      pendingUpdateRef.current = false;
      return;
    }

    // Initialiser si nécessaire
    // MAIS: Si le pathLength change de 2000 à la vraie valeur, on se réinitialisera dans le useEffect
    if (!isInitializedRef.current || lastInitializedPathLengthRef.current !== globalPathLength) {
      isInitializedRef.current = true;
      scrollYRef.current = window.scrollY;
      getUseCase().initialize(globalPathLength);
      lastInitializedPathLengthRef.current = globalPathLength;
    }

    scrollYRef.current = window.scrollY;
    const useCase = getUseCase();
    
    // Mettre à jour la vélocité depuis la position de scroll
    useCase.updateVelocity(scrollYRef.current);
    
    const result = useCase.updateScrollPosition(scrollYRef.current, globalPathLength);

    if (result.shouldCorrect && result.correctionY !== undefined) {
      window.scrollTo(0, result.correctionY);
    }

    // Utiliser targetProgress directement (sans easing/inertia) - scroll natif uniquement
    // Le navigateur gère le momentum scrolling naturellement
    const newProgress = useCase.getTargetProgress();
    useCase.syncCurrentToTarget();
    
    // Sur desktop : utiliser un seuil de changement minimum au lieu du throttling temporel
    // Cela évite les micro-dispatches qui causent des saccades, sans introduire de délai
    const PROGRESS_CHANGE_THRESHOLD = 0.0005; // Seuil minimum pour dispatcher (évite les micro-changements)
    
    if (isDesktop) {
      if (lastDispatchedProgressRef.current === null) {
        // Premier dispatch, toujours le faire
        lastDispatchedProgressRef.current = newProgress;
        dispatch(setProgress(newProgress));
      } else {
        // Vérifier si le changement est significatif
        const progressDelta = Math.abs(newProgress - lastDispatchedProgressRef.current);
        
        // Gérer le wraparound (0 ↔ 1)
        const wrappedDelta = Math.min(progressDelta, 1 - progressDelta);
        
        if (wrappedDelta >= PROGRESS_CHANGE_THRESHOLD) {
          lastDispatchedProgressRef.current = newProgress;
          dispatch(setProgress(newProgress));
        }
      }
    } else {
      // Sur mobile, dispatch direct (touch events moins fréquents)
      dispatch(setProgress(newProgress));
    }

    // Tracker la direction seulement si l'autoplay n'est pas actif
    if (!isAutoPlayingRef.current) {
      const direction = useCase.getScrollDirection();
      if (direction) {
        dispatch(setLastScrollDirection(direction));
        const autoScrollDirection = direction === 'forward' ? 1 : -1;
        dispatch(setAutoScrollDirection(autoScrollDirection));
      }
    }

    // TEMPORAIRE : Désactiver complètement easingLoop pour diagnostic
    // startEasingLoop();
    rafIdRef.current = null;
    pendingUpdateRef.current = false;
  }, [globalPathLength, isModalOpen, dispatch, getUseCase, isDesktop]);

  // Handler pour les interactions utilisateur (wheel, touch)
  const handleUserInteraction = useCallback((event?: Event) => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) return;
    
    // Accepter globalPathLength même s'il est à 2000 (valeur par défaut)
    // mais bloquer si vraiment invalide (<= 0)
    if (globalPathLength <= 0) return;

    // Initialiser si nécessaire (même si isScrollSynced est encore false)
    // Cela permet de gérer les interactions rapides après reload
    // MAIS: Si le pathLength change de 2000 à la vraie valeur, on se réinitialisera dans le useEffect
    if (!isInitializedRef.current || lastInitializedPathLengthRef.current !== globalPathLength) {
      isInitializedRef.current = true;
      scrollYRef.current = window.scrollY;
      try {
        getUseCase().initialize(globalPathLength);
        lastInitializedPathLengthRef.current = globalPathLength;
      } catch (error) {
        console.error('[useManualScrollSync] Erreur lors de l\'initialisation dans handleUserInteraction:', error);
        useCaseRef.current = new ManualScrollSyncUseCase(
          easingService,
          progressCalculator,
          stateDetector,
          velocityService,
          velocityConfig
        );
        useCaseRef.current.initialize(globalPathLength);
        lastInitializedPathLengthRef.current = globalPathLength;
      }
    }

    // Capturer la vélocité depuis l'événement wheel
    if (event && event.type === 'wheel') {
      const wheelEvent = event as WheelEvent;
      getUseCase().updateVelocityFromWheel(wheelEvent.deltaY);
    }

    // Ignorer les touches sur éléments interactifs (boutons, etc.)
    if (event && event.type.startsWith('touch')) {
      const touchEvent = event as TouchEvent;
      const target = touchEvent.target as HTMLElement;
      if (target && (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('[role="button"]')
      )) {
        return; // Ne pas mettre en pause l'autoplay
      }
    }

    // Mettre à jour scrollYRef immédiatement
    scrollYRef.current = window.scrollY;
    
    // Mettre à jour la vélocité depuis la position de scroll
    getUseCase().updateVelocity(scrollYRef.current);

    // Mettre en pause l'autoplay si actif
    if (isAutoPlayingRef.current) {
      isAutoPlayingRef.current = false;
      dispatch(setAutoPlaying(false));
    }

    if (onScrollState) {
      onScrollState(true);
    }

    getUseCase().updateLastScrollTime();

    // Détecter l'arrêt du scroll
    if (scrollEndRafIdRef.current !== null) {
      cancelAnimationFrame(scrollEndRafIdRef.current);
      scrollEndRafIdRef.current = null;
    }

    const checkScrollEnd = () => {
      const isEnded = getUseCase().checkScrollEnd();
      if (isEnded) {
        if (onScrollState) {
          onScrollState(false);
        }
        scrollEndRafIdRef.current = null;
      } else {
        scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);
      }
    };

    scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);

    // Programmer la mise à jour via RAF
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => {
        scrollYRef.current = window.scrollY;
        requestAnimationFrame(() => {
          scrollYRef.current = window.scrollY;
          processScrollUpdate();
        });
      });
    }
  }, [onScrollState, isModalOpen, processScrollUpdate, dispatch, globalPathLength, getUseCase, easingService, progressCalculator, stateDetector, velocityService, velocityConfig]);

  // Handler pour l'événement scroll
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isModalOpen) return;
    
    // Accepter globalPathLength même s'il est à 2000 (valeur par défaut)
    // mais bloquer si vraiment invalide (<= 0)
    if (globalPathLength <= 0) return;

    // Initialiser si nécessaire (même si isScrollSynced est encore false)
    // MAIS: Si le pathLength change de 2000 à la vraie valeur, on se réinitialisera dans le useEffect
    if (!isInitializedRef.current || lastInitializedPathLengthRef.current !== globalPathLength) {
      isInitializedRef.current = true;
      scrollYRef.current = window.scrollY;
      try {
        getUseCase().initialize(globalPathLength);
        lastInitializedPathLengthRef.current = globalPathLength;
      } catch (error) {
        console.error('[useManualScrollSync] Erreur lors de l\'initialisation dans handleScroll:', error);
        useCaseRef.current = new ManualScrollSyncUseCase(
          easingService,
          progressCalculator,
          stateDetector,
          velocityService,
          velocityConfig
        );
        useCaseRef.current.initialize(globalPathLength);
        lastInitializedPathLengthRef.current = globalPathLength;
      }
    }

    scrollYRef.current = window.scrollY;
    
    // Mettre à jour la vélocité depuis la position de scroll
    getUseCase().updateVelocity(scrollYRef.current);

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

    // Détecter l'arrêt du scroll
    if (scrollEndRafIdRef.current !== null) {
      cancelAnimationFrame(scrollEndRafIdRef.current);
      scrollEndRafIdRef.current = null;
    }

    const checkScrollEnd = () => {
      const isEnded = getUseCase().checkScrollEnd();
      if (isEnded) {
        if (onScrollState) {
          onScrollState(false);
        }
        scrollEndRafIdRef.current = null;
      } else {
        scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);
      }
    };

    scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);
  }, [isModalOpen, processScrollUpdate, onScrollState, globalPathLength, getUseCase, easingService, progressCalculator, stateDetector, velocityService, velocityConfig]);

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
      if (scrollEndRafIdRef.current !== null) {
        cancelAnimationFrame(scrollEndRafIdRef.current);
      }
      lastDispatchedProgressRef.current = null;
    };
  }, [handleUserInteraction, handleScroll]);

  // Initialisation (seulement si pas déjà initialisé par une interaction utilisateur)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isScrollSynced) return;
    if (isInitializedRef.current) return; // Déjà initialisé par handleUserInteraction ou handleScroll
    // CRITIQUE: Attendre que la VRAIE longueur du path soit connue (> 2000)
    // Sinon on s'initialise avec le mauvais pathLength
    if (globalPathLength <= 0 || globalPathLength <= 2000) return;

    isInitializedRef.current = true;
    scrollYRef.current = window.scrollY;

    const hash = window.location.hash;
    const hasHash = hash && hash.replace('#', '').trim().length > 0;
    
    try {
      if (hasHash) {
        getUseCase().initialize(globalPathLength, currentProgress);
      } else {
        getUseCase().initialize(globalPathLength);
        processScrollUpdate();
      }
      lastInitializedPathLengthRef.current = globalPathLength;
    } catch (error) {
      console.error('[useManualScrollSync] Erreur lors de l\'initialisation dans useEffect:', error);
      useCaseRef.current = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig
      );
      if (hasHash) {
        useCaseRef.current.initialize(globalPathLength, currentProgress);
      } else {
        useCaseRef.current.initialize(globalPathLength);
      }
      lastInitializedPathLengthRef.current = globalPathLength;
    }
  }, [isScrollSynced, globalPathLength, currentProgress, processScrollUpdate, getUseCase, easingService, progressCalculator, stateDetector, velocityService, velocityConfig]);
}
