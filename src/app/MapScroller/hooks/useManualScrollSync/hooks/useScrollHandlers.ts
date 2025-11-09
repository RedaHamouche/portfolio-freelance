import { useCallback, useMemo } from 'react';
import type { AppDispatch } from '@/store';
import type { ScrollContextType } from '../../../contexts/ScrollContext';
import { processScrollUpdate, type ProcessScrollUpdateRefs, type ProcessScrollUpdateCallbacks } from '../actions/processScrollUpdate';
import { handleUserInteraction, type HandleUserInteractionCallbacks, type HandleUserInteractionRefs } from '../actions/handleUserInteraction';
import { handleScroll, type HandleScrollCallbacks, type HandleScrollRefs } from '../actions/handleScroll';
import { scheduleScrollEndCheck } from './useScrollEndCheck';
import type { ManualScrollSyncUseCase } from '../ManualScrollSyncUseCase';

/**
 * Interface pour toutes les refs nécessaires aux handlers
 */
export interface ScrollHandlersRefs
  extends ProcessScrollUpdateRefs,
    HandleUserInteractionRefs,
    HandleScrollRefs {
  scrollEndTimeoutRef: { current: NodeJS.Timeout | null };
}

/**
 * Hook pour créer les handlers de scroll
 * Centralise la création des handlers avec le contexte et les callbacks
 */
export function useScrollHandlers(
  scrollContext: ScrollContextType,
  dispatch: AppDispatch,
  refs: ScrollHandlersRefs,
  callbacks: {
    initializeUseCase: (pathLength: number, progress?: number) => void;
    getUseCase: () => ManualScrollSyncUseCase;
    startEasingLoop: () => void;
    updateScrollDirectionCallback: (useCase: ManualScrollSyncUseCase) => void;
    onScrollState?: (isScrolling: boolean) => void;
  },
  globalPathLength: number,
  isModalOpen: boolean
) {
  // Fonction pour programmer la vérification de fin de scroll
  const scheduleScrollEndCheckCallback = useCallback(() => {
    scheduleScrollEndCheck(
      callbacks.getUseCase,
      callbacks.onScrollState,
      refs.scrollEndTimeoutRef
    );
  }, [callbacks.getUseCase, callbacks.onScrollState, refs.scrollEndTimeoutRef]);

  // Fonction pour gérer l'initialisation et la mise à jour de la vélocité
  const handleInitializationAndVelocity = useCallback(
    (event?: Event) => {
      // Initialiser si nécessaire
      if (!refs.isInitializedRef.current || refs.lastInitializedPathLengthRef.current !== globalPathLength) {
        refs.scrollYRef.current = window.scrollY;
        callbacks.initializeUseCase(globalPathLength);
      }

      // Mettre à jour scrollYRef et la vélocité
      refs.scrollYRef.current = window.scrollY;
      if (event && event.type === 'wheel' && scrollContext.velocityConfig.enabled) {
        const wheelEvent = event as WheelEvent;
        callbacks.getUseCase().updateVelocityFromWheel(wheelEvent.deltaY);
      }
      refs.scrollYRef.current = window.scrollY;
      if (scrollContext.velocityConfig.enabled) {
        callbacks.getUseCase().updateVelocity(refs.scrollYRef.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      globalPathLength,
      callbacks.initializeUseCase,
      callbacks.getUseCase,
      scrollContext.velocityConfig,
      refs.isInitializedRef,
      refs.lastInitializedPathLengthRef,
      refs.scrollYRef,
      // callbacks est un objet qui change à chaque render, mais on utilise seulement ses propriétés individuelles
    ]
  );

  // Callbacks pour processScrollUpdate (mémoïsés pour éviter les recréations)
  const processScrollUpdateCallbacks: ProcessScrollUpdateCallbacks = useMemo(
    () => ({
      initializeUseCase: callbacks.initializeUseCase,
      getUseCase: callbacks.getUseCase,
      startEasingLoop: callbacks.startEasingLoop,
      updateScrollDirectionCallback: callbacks.updateScrollDirectionCallback,
    }),
    [
      callbacks.initializeUseCase,
      callbacks.getUseCase,
      callbacks.startEasingLoop,
      callbacks.updateScrollDirectionCallback,
    ]
  );

  // Handler processScrollUpdate
  const processScrollUpdateCallback = useCallback(() => {
    processScrollUpdate(
      scrollContext,
      dispatch,
      refs,
      processScrollUpdateCallbacks,
      globalPathLength,
      isModalOpen
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scrollContext,
    dispatch,
    processScrollUpdateCallbacks,
    globalPathLength,
    isModalOpen,
    // refs sont stables, pas besoin de les inclure dans les dépendances
  ]);

  // Callbacks pour handleUserInteraction (mémoïsés)
  const handleUserInteractionCallbacks: HandleUserInteractionCallbacks = useMemo(
    () => ({
      handleInitializationAndVelocity,
      processScrollUpdate: processScrollUpdateCallback,
      scheduleScrollEndCheck: scheduleScrollEndCheckCallback,
      getUseCase: callbacks.getUseCase,
      onScrollState: callbacks.onScrollState,
    }),
    [
      handleInitializationAndVelocity,
      processScrollUpdateCallback,
      scheduleScrollEndCheckCallback,
      callbacks.getUseCase,
      callbacks.onScrollState,
    ]
  );

  // Handler handleUserInteraction
  const handleUserInteractionCallback = useCallback(
    (event?: Event) => {
      handleUserInteraction(
        event,
        dispatch,
        refs,
        handleUserInteractionCallbacks,
        globalPathLength,
        isModalOpen
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      dispatch,
      handleUserInteractionCallbacks,
      globalPathLength,
      isModalOpen,
      // refs sont stables, pas besoin de les inclure dans les dépendances
    ]
  );

  // Callbacks pour handleScroll (mémoïsés)
  const handleScrollCallbacks: HandleScrollCallbacks = useMemo(
    () => ({
      handleInitializationAndVelocity,
      processScrollUpdate: processScrollUpdateCallback,
      scheduleScrollEndCheck: scheduleScrollEndCheckCallback,
      getUseCase: callbacks.getUseCase,
      onScrollState: callbacks.onScrollState,
    }),
    [
      handleInitializationAndVelocity,
      processScrollUpdateCallback,
      scheduleScrollEndCheckCallback,
      callbacks.getUseCase,
      callbacks.onScrollState,
    ]
  );

  // Handler handleScroll
  const handleScrollCallback = useCallback(() => {
    handleScroll(dispatch, refs, handleScrollCallbacks, globalPathLength, isModalOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, handleScrollCallbacks, globalPathLength, isModalOpen]);
  // refs sont stables, pas besoin de les inclure dans les dépendances

  return {
    handleUserInteraction: handleUserInteractionCallback,
    handleScroll: handleScrollCallback,
    processScrollUpdate: processScrollUpdateCallback,
  };
}

