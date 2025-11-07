import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setProgress, setLastScrollDirection } from '@/store/scrollSlice';
import { ManualScrollSyncUseCase } from './application/ManualScrollSyncUseCase';
import { ScrollEasingService, EasingFunctions } from './domain/ScrollEasingService';
import { ScrollProgressCalculator } from './domain/ScrollProgressCalculator';
import { ScrollStateDetector } from './domain/ScrollStateDetector';
import { SCROLL_INERTIA_FACTOR, SCROLL_EASING_TYPE, SCROLL_EASING_MIN_DELTA } from '@/config';

/**
 * Hook pour synchroniser le scroll manuel avec le progress
 * Utilise une architecture DDD avec des services de domaine et un use case
 */
export function useManualScrollSync(
  globalPathLength: number,
  onScrollState?: (isScrolling: boolean) => void,
  isScrollSynced: boolean = true
) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: RootState) => state.modal.isOpen);
  const currentProgress = useSelector((state: RootState) => state.scroll.progress);

  // Créer les services de domaine (mémoïsés pour éviter les recréations)
  // Inertie et Easing sont découplés et paramétrables via la config
  const easingFunction = useMemo(() => {
    return EasingFunctions[SCROLL_EASING_TYPE] || EasingFunctions.linear;
  }, []);
  
  const easingService = useMemo(() => new ScrollEasingService(
    SCROLL_INERTIA_FACTOR, // Force de l'inertie
    easingFunction,        // Courbe d'easing
    SCROLL_EASING_MIN_DELTA
  ), [easingFunction]);
  const progressCalculator = useMemo(() => new ScrollProgressCalculator(), []);
  const stateDetector = useMemo(() => new ScrollStateDetector(150), []);

  // Créer le use case (mémoïsé)
  const useCaseRef = useRef<ManualScrollSyncUseCase | null>(null);
  if (!useCaseRef.current) {
    useCaseRef.current = new ManualScrollSyncUseCase(
      easingService,
      progressCalculator,
      stateDetector
    );
  }

  // Refs pour la gestion du RAF
  const isInitializedRef = useRef(false);
  const scrollYRef = useRef(0);
  const scrollEndRafIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);
  const easingRafIdRef = useRef<number | null>(null);
  const isEasingActiveRef = useRef(false);

  // Boucle d'easing pour interpoler le progress
  const easingLoop = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Ne pas animer si une modal est ouverte
    if (isModalOpen) {
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
      return;
    }

    const shouldContinue = useCaseRef.current!.animateEasing();
    const progressFromUseCase = useCaseRef.current!.getCurrentProgress();
    dispatch(setProgress(progressFromUseCase));

    // Tracker la direction
    const direction = useCaseRef.current!.getScrollDirection();
    if (direction) {
      dispatch(setLastScrollDirection(direction));
    }

    if (shouldContinue) {
      easingRafIdRef.current = requestAnimationFrame(easingLoop);
    } else {
      isEasingActiveRef.current = false;
      easingRafIdRef.current = null;
    }
  }, [dispatch, isModalOpen]);

  // Démarrer la boucle d'easing
  const startEasingLoop = useCallback(() => {
    if (!isEasingActiveRef.current) {
      isEasingActiveRef.current = true;
      easingRafIdRef.current = requestAnimationFrame(easingLoop);
    }
  }, [easingLoop]);

  // Traiter la mise à jour du scroll
  const processScrollUpdate = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Ne pas mettre à jour si une modal est ouverte
    if (isModalOpen) {
      rafIdRef.current = null;
      pendingUpdateRef.current = false;
      return;
    }

    const currentScrollY = scrollYRef.current;
    const result = useCaseRef.current!.updateScrollPosition(currentScrollY, globalPathLength);

    // Corriger le scroll si nécessaire
    if (result.shouldCorrect && result.correctionY !== undefined) {
      window.scrollTo(0, result.correctionY);
    }

    // Tracker la direction du scroll
    const direction = useCaseRef.current!.getScrollDirection();
    if (direction) {
      dispatch(setLastScrollDirection(direction));
    }

    // Démarrer la boucle d'easing
    startEasingLoop();

    // Réinitialiser le flag
    rafIdRef.current = null;
    pendingUpdateRef.current = false;
  }, [globalPathLength, isModalOpen, startEasingLoop, dispatch]);

  // Handler pour les événements de scroll
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Ignorer si une modal est ouverte
    if (isModalOpen) {
      return;
    }

    // Mettre à jour la valeur de scroll
    scrollYRef.current = window.scrollY;

    // Indiquer que le scroll est en cours
    if (onScrollState) {
      onScrollState(true);
    }

    // Mettre à jour le temps du dernier scroll
    useCaseRef.current!.updateLastScrollTime();

    // Annuler le RAF précédent qui détecte l'arrêt du scroll
    if (scrollEndRafIdRef.current !== null) {
      cancelAnimationFrame(scrollEndRafIdRef.current);
      scrollEndRafIdRef.current = null;
    }

    // Fonction récursive pour détecter l'arrêt du scroll
    const checkScrollEnd = () => {
      const isEnded = useCaseRef.current!.checkScrollEnd();

      if (isEnded) {
        if (onScrollState) {
          onScrollState(false);
        }
        scrollEndRafIdRef.current = null;
      } else {
        scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);
      }
    };

    // Démarrer la vérification
    scrollEndRafIdRef.current = requestAnimationFrame(checkScrollEnd);

    // Programmer une mise à jour via RAF si aucune n'est déjà en cours
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => {
        processScrollUpdate();
      });
    }
  }, [onScrollState, isModalOpen, processScrollUpdate]);

  // Ajouter l'event listener scroll (toujours, pour que le scroll fonctionne)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollEndRafIdRef.current !== null) {
        cancelAnimationFrame(scrollEndRafIdRef.current);
        scrollEndRafIdRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (easingRafIdRef.current !== null) {
        cancelAnimationFrame(easingRafIdRef.current);
        easingRafIdRef.current = null;
        isEasingActiveRef.current = false;
      }
    };
  }, [handleScroll]);

  // Initialisation (attend que useScrollInitialization ait fini si hash présent)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Attendre que useScrollInitialization ait fini (si pas encore synced)
    if (!isScrollSynced) return;
    // Éviter l'appel initial si déjà initialisé
    if (isInitializedRef.current) return;

    isInitializedRef.current = true;
    scrollYRef.current = window.scrollY;

    // Vérifier si un hash est présent dans l'URL
    const hash = window.location.hash;
    const hasHash = hash && hash.replace('#', '').trim().length > 0;
    
    if (hasHash) {
      // Hash présent : utiliser le progress du store (défini par useScrollInitialization)
      // useScrollInitialization a déjà défini le progress et fait le scrollTo
      useCaseRef.current!.initialize(globalPathLength, currentProgress);
      // Ne pas appeler processScrollUpdate() - le hash a la priorité
    } else {
      // Pas de hash : initialiser normalement depuis window.scrollY
      useCaseRef.current!.initialize(globalPathLength);
      processScrollUpdate();
    }
  }, [isScrollSynced, globalPathLength, currentProgress, processScrollUpdate]);
}
