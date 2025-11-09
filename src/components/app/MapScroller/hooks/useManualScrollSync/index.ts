import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ManualScrollSyncUseCase } from './application/ManualScrollSyncUseCase';
import { DEFAULT_PATH_LENGTH } from '@/config';
import { useScrollStateRefs } from './hooks/useScrollStateRefs';
import { useScrollContext } from '@/contexts/ScrollContext';
import { shouldReinitializeForPathLength } from './utils/shouldReinitializeForPathLength';
import { updateScrollDirection } from './actions/updateScrollDirection';
import { useScrollHandlers } from './hooks/useScrollHandlers';
import { useEasingLoop } from './hooks/useEasingLoop';
import { useScrollEventListeners } from './hooks/useScrollEventListeners';
import { useScrollInitialization } from './hooks/useScrollInitialization';
import { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';

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

  // REFACTORING: Utiliser le contexte de scroll au lieu de créer les services localement
  const scrollContext = useScrollContext();
  const { easingService, progressCalculator, stateDetector, velocityService, velocityConfig, pathDomain, progressInitService } = scrollContext;

  // Service pour mettre à jour le progress (source unique de vérité)
  const progressUpdateService = useMemo(() => new ProgressUpdateService(dispatch), [dispatch]);

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

  // REFACTORING: Regrouper toutes les refs dans un hook personnalisé
  const refs = useScrollStateRefs(isAutoPlaying);

  // REFACTORING: Utiliser le sous-hook pour l'initialisation
  const { initializeUseCase } = useScrollInitialization(scrollContext, refs, getUseCase);

  // REFACTORING: Fonction pour mettre à jour la direction du scroll
  const updateScrollDirectionCallback = useCallback(
    (useCase: ManualScrollSyncUseCase) => {
      updateScrollDirection(useCase, progressUpdateService, refs.isAutoPlayingRef, refs.lastScrollDirectionRef);
    },
    [progressUpdateService, refs.isAutoPlayingRef, refs.lastScrollDirectionRef]
  );

  // REFACTORING: Utiliser le sous-hook pour la boucle d'easing
  const { startEasingLoop } = useEasingLoop(scrollContext, refs, progressUpdateService, isModalOpen, getUseCase);

  // REFACTORING: Mémoïser les callbacks pour éviter les recréations
  const scrollHandlersCallbacks = useMemo(
    () => ({
      initializeUseCase,
      getUseCase,
      startEasingLoop,
      updateScrollDirectionCallback,
      onScrollState,
    }),
    [initializeUseCase, getUseCase, startEasingLoop, updateScrollDirectionCallback, onScrollState]
  );

  // REFACTORING: Utiliser le sous-hook pour créer les handlers
  const { handleUserInteraction, handleScroll, processScrollUpdate } = useScrollHandlers(
    scrollContext,
    progressUpdateService,
    dispatch,
    refs,
    scrollHandlersCallbacks,
    globalPathLength,
    isModalOpen
  );

  // FIX: Ne pas attacher les event listeners tant que le système n'est pas prêt
  // Le système est prêt si : isScrollSynced ET globalPathLength valide
  const isSystemReady = isScrollSynced && globalPathLength > DEFAULT_PATH_LENGTH;

  // REFACTORING: Utiliser le sous-hook pour les event listeners
  useScrollEventListeners(handleUserInteraction, handleScroll, refs, isSystemReady);

  // Synchroniser isAutoPlayingRef et détecter les changements de pathLength
  useEffect(() => {
    const wasAutoPlaying = refs.prevIsAutoPlayingRef.current;
    refs.prevIsAutoPlayingRef.current = isAutoPlaying;
    refs.isAutoPlayingRef.current = isAutoPlaying;

    // Si le pathLength a changé de DEFAULT_PATH_LENGTH (défaut) à la vraie valeur, réinitialiser
    if (shouldReinitializeForPathLength(globalPathLength, refs.lastInitializedPathLengthRef.current, refs.isInitializedRef.current)) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '[useManualScrollSync] PathLength changé de',
          refs.lastInitializedPathLengthRef.current,
          'à',
          globalPathLength,
          '- Réinitialisation'
        );
      }
      refs.scrollYRef.current = window.scrollY;
      initializeUseCase(globalPathLength);
      const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
      progressUpdateService.updateProgressOnly(progressResult.progress);
      return;
    }

    // Quand l'autoplay s'arrête, réinitialiser pour synchroniser avec window.scrollY
    if (wasAutoPlaying && !isAutoPlaying && typeof window !== 'undefined') {
      refs.scrollYRef.current = window.scrollY;
      initializeUseCase(globalPathLength);
      const progressResult = progressCalculator.calculateProgress(window.scrollY, globalPathLength);
      progressUpdateService.updateProgressOnly(progressResult.progress);
    }
  }, [
    isAutoPlaying,
    globalPathLength,
    progressUpdateService,
    initializeUseCase,
    progressCalculator,
    refs.isAutoPlayingRef,
    refs.lastInitializedPathLengthRef,
    refs.prevIsAutoPlayingRef,
    refs.scrollYRef,
    refs.isInitializedRef,
  ]);

  // Initialisation (seulement si pas déjà initialisé par une interaction utilisateur)
  // FIX: Permettre l'initialisation même si isScrollSynced est false (si globalPathLength est valide)
  // Cela évite le blocage du scroll si l'utilisateur scroll pendant le chargement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (refs.isInitializedRef.current) return; // Déjà initialisé
    // Attendre que la VRAIE longueur du path soit connue (> DEFAULT_PATH_LENGTH)
    if (globalPathLength <= 0 || globalPathLength <= DEFAULT_PATH_LENGTH) return;

    // FIX: Initialiser même si isScrollSynced est false (initialisation anticipée)
    // Cela permet au scroll de fonctionner si l'utilisateur scroll pendant le chargement
    refs.scrollYRef.current = window.scrollY;
    const hash = window.location.hash;
    const hasHash = hash && hash.replace('#', '').trim().length > 0;

    if (hasHash) {
      // Utiliser le service centralisé pour calculer le progress
      const result = progressInitService.initializeProgress(hash, pathDomain);
      const progressToUse = result.progress;
      initializeUseCase(globalPathLength, progressToUse);
      // Ne pas dispatcher ici car useScrollInitialization l'a déjà fait (si isScrollSynced est true)
    } else {
      // Pas de hash : utiliser currentProgress qui a été initialisé par useScrollInitialization
      // Si isScrollSynced est false, currentProgress peut être 0, donc on initialise sans progress
      const progressToUse = currentProgress !== 0.005 && currentProgress > 0 ? currentProgress : undefined;
      initializeUseCase(globalPathLength, progressToUse);
      if (!progressToUse) {
        // Si pas de progress, calculer depuis window.scrollY
        processScrollUpdate();
      }
    }
  }, [
    isScrollSynced, // Garder dans les dépendances pour réinitialiser si isScrollSynced devient true
    globalPathLength,
    currentProgress,
    processScrollUpdate,
    initializeUseCase,
    pathDomain,
    progressInitService,
    refs.isInitializedRef,
    refs.scrollYRef,
  ]);
}
