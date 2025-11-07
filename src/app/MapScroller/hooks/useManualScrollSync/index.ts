import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setProgress, setLastScrollDirection, setAutoPlaying, setAutoScrollDirection } from '@/store/scrollSlice';
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
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);

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
  const isAutoPlayingRef = useRef(isAutoPlaying);
  const prevIsAutoPlayingRef = useRef(isAutoPlaying);

  // Synchroniser la ref avec la valeur Redux
  useEffect(() => {
    const wasAutoPlaying = prevIsAutoPlayingRef.current;
    prevIsAutoPlayingRef.current = isAutoPlaying;
    isAutoPlayingRef.current = isAutoPlaying;

    // Quand l'autoplay s'arrête (passe de true à false), réinitialiser le use case
    // pour synchroniser avec la position actuelle de window.scrollY
    // Cela évite que le PointTrail "téléporte" quand on scroll manuellement après l'autoplay
    if (wasAutoPlaying && !isAutoPlaying && typeof window !== 'undefined') {
      // Réinitialiser le use case avec la position actuelle de scroll
      scrollYRef.current = window.scrollY;
      useCaseRef.current!.initialize(globalPathLength);
      // Mettre à jour le progress dans le store pour qu'il corresponde à window.scrollY
      // Utiliser le progressCalculator directement pour calculer le progress depuis window.scrollY
      const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
      dispatch(setProgress(progressResult.progress));
    }
  }, [isAutoPlaying, globalPathLength, dispatch, progressCalculator]);

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

    // Tracker la direction SEULEMENT si l'autoplay n'est pas actif
    // Sinon, l'autoplay gère déjà la direction et on évite les conflits/glitches
    // Utiliser isAutoPlayingRef pour avoir la valeur à jour même si Redux n'a pas encore propagé la mise à jour
    if (!isAutoPlayingRef.current) {
      const direction = useCaseRef.current!.getScrollDirection();
      if (direction) {
        dispatch(setLastScrollDirection(direction));
        // Synchroniser la direction de l'autoplay avec la dernière direction scrollée
        // Cela permet que quand on relance l'autoplay, il aille dans la même direction
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

    // Note: On ne met plus en pause l'autoplay ici car on le fait dans handleUserInteraction
    // qui écoute directement les événements wheel/touch (déclenchés uniquement par l'utilisateur)

    // Tracker la direction du scroll SEULEMENT si l'autoplay n'est pas actif
    // Sinon, l'autoplay gère déjà la direction et on évite les conflits/glitches
    // Utiliser isAutoPlayingRef pour avoir la valeur à jour même si Redux n'a pas encore propagé la mise à jour
    if (!isAutoPlayingRef.current) {
      const direction = useCaseRef.current!.getScrollDirection();
      if (direction) {
        dispatch(setLastScrollDirection(direction));
        // Synchroniser la direction de l'autoplay avec la dernière direction scrollée
        // Cela permet que quand on relance l'autoplay, il aille dans la même direction
        const autoScrollDirection = direction === 'forward' ? 1 : -1;
        dispatch(setAutoScrollDirection(autoScrollDirection));
      }
    }

    // Démarrer la boucle d'easing
    startEasingLoop();

    // Réinitialiser le flag
    rafIdRef.current = null;
    pendingUpdateRef.current = false;
  }, [globalPathLength, isModalOpen, startEasingLoop, dispatch]);

  // Handler pour détecter les interactions utilisateur (wheel, touch)
  // Ces événements sont déclenchés UNIQUEMENT par l'utilisateur, pas par window.scrollTo()
  const handleUserInteraction = useCallback((event?: Event) => {
    if (typeof window === 'undefined') return;

    // Ignorer si une modal est ouverte
    if (isModalOpen) {
      return;
    }

    // Sur mobile, ignorer les touches sur des éléments interactifs (boutons, inputs, etc.)
    // pour éviter de mettre en pause l'autoplay quand on clique sur un bouton
    if (event && event.type.startsWith('touch')) {
      const touchEvent = event as TouchEvent;
      const target = touchEvent.target as HTMLElement;
      
      // Vérifier si le touch est sur un élément interactif
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
        // C'est un touch sur un élément interactif, ne pas mettre en pause l'autoplay
        return;
      }
    }

    // Mettre en pause l'autoplay si un scroll manuel est détecté
    // Cela permet à l'utilisateur de reprendre le contrôle
    // Mettre à jour la ref immédiatement pour que processScrollUpdate() utilise la bonne valeur
    if (isAutoPlayingRef.current) {
      isAutoPlayingRef.current = false;
      dispatch(setAutoPlaying(false));
    }

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
  }, [onScrollState, isModalOpen, processScrollUpdate, dispatch]);

  // Handler pour les événements de scroll (pour synchroniser le progress)
  // On garde cet événement pour la synchronisation, mais on ne met plus en pause l'autoplay ici
  // Note: handleUserInteraction (wheel/touch) est prioritaire pour détecter les scrolls manuels
  // mais handleScroll est nécessaire pour les scrolls via la barre de défilement
  // IMPORTANT: window.scrollTo() déclenche aussi l'événement scroll, mais pas wheel/touch
  // Donc on peut utiliser handleScroll pour synchroniser le progress sans risquer de conflit
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Ignorer si une modal est ouverte
    if (isModalOpen) {
      return;
    }

    // Mettre à jour la valeur de scroll
    scrollYRef.current = window.scrollY;

    // Programmer une mise à jour via RAF si aucune n'est déjà en cours
    // Cela permet de synchroniser le progress même si l'utilisateur scroll via la barre de défilement
    // (sans déclencher wheel/touch) ou si window.scrollTo() est appelé
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          processScrollUpdate();
        });
      }
    }

    // Indiquer que le scroll est en cours (pour onScrollState)
    // Note: onScrollState est appelé ici pour les scrolls via la barre de défilement
    // mais pas pour les scrolls programmatiques (car on ne peut pas les distinguer facilement)
    // C'est acceptable car processScrollUpdate() mettra à jour le progress de toute façon
    if (onScrollState) {
      onScrollState(true);
    }

    // Mettre à jour le temps du dernier scroll pour la détection d'arrêt
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
  }, [isModalOpen, processScrollUpdate, onScrollState]);

  // Ajouter les event listeners pour détecter les interactions utilisateur
  // Ces événements sont déclenchés UNIQUEMENT par l'utilisateur, pas par window.scrollTo()
  useEffect(() => {
    if (typeof window === 'undefined' || !isScrollSynced) return;

    // Créer des wrappers pour les événements touch afin de passer l'événement
    const touchStartHandler = (e: TouchEvent) => handleUserInteraction(e);
    const touchMoveHandler = (e: TouchEvent) => handleUserInteraction(e);

    // Écouter les événements wheel (souris, trackpad)
    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    
    // Écouter les événements touch (mobile)
    // Passer l'événement pour pouvoir vérifier si c'est un touch sur un élément interactif
    window.addEventListener('touchstart', touchStartHandler, { passive: true });
    window.addEventListener('touchmove', touchMoveHandler, { passive: true });

    // Garder l'événement scroll pour la synchronisation du progress
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
    };
  }, [handleUserInteraction, handleScroll, isScrollSynced]);


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
