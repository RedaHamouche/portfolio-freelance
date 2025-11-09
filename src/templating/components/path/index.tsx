/**
 * Composant React pour le domaine Path
 * Utilise l'API du domaine Path pour rendre les composants
 */

"use client"
import React, { useEffect, useMemo, useCallback, useRef, memo } from 'react';
import mappingComponent from '@/templating/mappingComponent';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { setProgress } from '@/store/scrollSlice';
import { getPointOnPath as getPointOnPathUtil } from '@/utils/pathCalculations';
import { useTemplatingContext } from '@/contexts/TemplatingContext';
import { useDevice } from '@/contexts/DeviceContext';
import {
  calculateFakeScrollHeight,
  calculateMaxScroll,
  calculateScrollYFromProgress,
} from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';

interface DynamicPathComponentsProps {
  svgPath: SVGPathElement | null;
  paddingX: number;
  paddingY: number;
}

// useMultipleInView supprimé - voir OPTIMIZATION_NOTES.md pour l'historique

interface MemoizedPathComponentProps {
  Comp: React.ComponentType<Record<string, unknown>>;
  component: Record<string, unknown> & { displayName: string; type: string };
  position: { x: number; y: number };
}

// Composant mémoïsé pour chaque élément du path
const MemoizedPathComponent = memo(function PathComponentMemo({ 
  Comp, 
  component, 
  position, 
  mapScale,
}: MemoizedPathComponentProps & { 
  mapScale: number;
}) {
  return (
    <div
      data-name={`${component.displayName}-PATH-COMPONENT`}
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        pointerEvents: 'auto',
        zIndex: 10,
        opacity: 1, // Opacity directe, pas d'animation ni de lazy loading
        transform: `translate(-50%, -50%) scale(${1 / mapScale})`,
        transformOrigin: 'center',
      }}
    >
      {Comp && <Comp {...component} />}
    </div>
  );
});

export default function DynamicPathComponents({ svgPath, paddingX, paddingY }: DynamicPathComponentsProps) {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const { mapScale } = useResponsivePath();
  // Utiliser isDesktop pré-détecté côté serveur (évite le FOUC)
  const { isDesktop } = useDevice();
  const dispatch = useDispatch();

  // Utiliser le domaine Path depuis le context (source unique de vérité)
  const { pathDomain } = useTemplatingContext();

  // Récupérer pathLength du store pour optimiser getPointOnPath
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);

  // Gestion du deeplink (hash) - seulement pour les changements de hash
  // Le chargement initial est géré par useScrollInitialization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const anchorComponent = pathDomain.getComponentByAnchorId(hash, isDesktop);
      if (anchorComponent && anchorComponent.position && typeof anchorComponent.position.progress === 'number') {
        const progress = anchorComponent.position.progress;
        dispatch(setProgress(progress));
        
        // Synchroniser la position de scroll avec le progress
        if (pathLength > 0) {
          const fakeScrollHeight = calculateFakeScrollHeight(pathLength);
          const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
          const targetScrollY = calculateScrollYFromProgress(progress, maxScroll);
          window.scrollTo({ top: targetScrollY, behavior: 'auto' });
        }
      }
    };
    // On gère seulement les changements de hash (pas le chargement initial)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [dispatch, pathDomain, isDesktop, pathLength]);

  // Récupérer tous les composants via l'API du domaine selon le breakpoint
  const pathComponents = useMemo(() => pathDomain.getAllComponents(isDesktop), [pathDomain, isDesktop]);

  // Mémoïser la fonction getPositionOnPath pour éviter les re-créations
  const getPointOnPath = useCallback((progressValue: number) => {
    if (!svgPath) return { x: 0, y: 0 };
    const point = getPointOnPathUtil(svgPath, progressValue, pathLength > 0 ? pathLength : undefined);
    return { x: point.x, y: point.y };
  }, [svgPath, pathLength]);

  // Refs supprimés - plus besoin d'IntersectionObserver pour l'opacity
  // activeAnchors et inViews supprimés - tous les composants sont toujours visibles

  // OPTIMISATION: Cache pour getActiveComponents avec seuil de changement significatif
  const lastProgressRef = useRef<number | null>(null);
  const cachedActiveComponentsRef = useRef<typeof pathComponents>([]);
  const PROGRESS_CHANGE_THRESHOLD = 0.001; // Seuil de changement significatif (0.1% du path)
  
  // OPTIMISATION: Cache pour les positions des composants
  const lastPositionsProgressRef = useRef<number | null>(null);
  const cachedPositionsRef = useRef<Array<{ x: number; y: number }>>([]);
  const POSITION_PROGRESS_THRESHOLD = 0.0005; // Seuil plus strict pour les positions (0.05% du path)

  // Mise à jour du hash dans l'URL quand un composant anchor devient actif
  // OPTIMISATION: Ne recalculer que si le progress a changé significativement
  const activeAnchorId = useMemo(() => {
    // Vérifier si le progress a changé significativement
    if (lastProgressRef.current !== null) {
      const progressDelta = Math.abs(progress - lastProgressRef.current);
      const wrappedDelta = Math.min(progressDelta, 1 - progressDelta); // Gérer wraparound
      
      // Si le changement est trop petit, utiliser le cache
      if (wrappedDelta < PROGRESS_CHANGE_THRESHOLD) {
        const firstActiveWithAnchor = cachedActiveComponentsRef.current.find(c => c.anchorId);
        return firstActiveWithAnchor?.anchorId || null;
      }
    }
    
    // Recalculer si le changement est significatif
    const activeComponents = pathDomain.getActiveComponents(progress, isDesktop);
    cachedActiveComponentsRef.current = activeComponents;
    lastProgressRef.current = progress;
    
    const firstActiveWithAnchor = activeComponents.find(c => c.anchorId);
    return firstActiveWithAnchor?.anchorId || null;
  }, [progress, pathDomain, isDesktop]);
  
  // Refs pour le throttling et le tracking
  const lastUpdatedAnchorIdRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingAnchorIdRef = useRef<string | null>(null);
  const THROTTLE_MS = 200; // Throttle de 200ms pour limiter les appels à history.replaceState()
  
  // Mettre à jour le hash avec throttling basé sur requestAnimationFrame
  useEffect(() => {
    // Stocker l'anchorId actuel pour traitement différé
    pendingAnchorIdRef.current = activeAnchorId;
    
    // Annuler le RAF précédent si présent
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Fonction de mise à jour avec throttling
    const updateHash = () => {
      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      const anchorId = pendingAnchorIdRef.current;
      
      // Throttle : ne mettre à jour que toutes les 200ms maximum
      if (timeSinceLastUpdate < THROTTLE_MS) {
        // Vérifier si l'anchorId a changé avant de reprogrammer
        // Si l'anchorId n'a pas changé, on n'a pas besoin de reprogrammer
        if (anchorId === lastUpdatedAnchorIdRef.current) {
          rafIdRef.current = null;
          return; // Pas besoin de mettre à jour, annuler
        }
        // Reprogrammer pour plus tard (throttle actif)
        rafIdRef.current = requestAnimationFrame(updateHash);
        return;
      }
      
      // Vérifier si l'anchorId a vraiment changé
      if (anchorId !== lastUpdatedAnchorIdRef.current) {
        const currentHash = window.location.hash.replace('#', '');
        
        if (anchorId) {
          // Mettre à jour le hash avec le nouvel anchorId
          if (currentHash !== anchorId) {
            history.replaceState(null, '', `#${anchorId}`);
          }
          lastUpdatedAnchorIdRef.current = anchorId;
        } else {
          // Aucun composant actif, retirer le hash si présent
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          lastUpdatedAnchorIdRef.current = null;
        }
        
        lastUpdateTimeRef.current = now;
      }
      
      rafIdRef.current = null;
    };
    
    // Programmer la mise à jour avec RAF
    rafIdRef.current = requestAnimationFrame(updateHash);
    
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [activeAnchorId]);

  // OPTIMISATION: Cache pour les positions avec seuil de changement significatif
  // Ne recalculer que si le progress a changé significativement
  const positions = useMemo(() => {
    // Vérifier si le progress a changé significativement
    if (lastPositionsProgressRef.current !== null) {
      const progressDelta = Math.abs(progress - lastPositionsProgressRef.current);
      const wrappedDelta = Math.min(progressDelta, 1 - progressDelta); // Gérer wraparound
      
      // Si le changement est trop petit, utiliser le cache
      if (wrappedDelta < POSITION_PROGRESS_THRESHOLD) {
        return cachedPositionsRef.current;
      }
    }
    
    // Recalculer si le changement est significatif
    const newPositions = pathComponents.map((component) => 
      pathDomain.calculateComponentPosition(component, getPointOnPath, paddingX, paddingY)
    );
    
    // Mettre à jour le cache
    cachedPositionsRef.current = newPositions;
    lastPositionsProgressRef.current = progress;
    
    return newPositions;
  }, [pathComponents, getPointOnPath, paddingX, paddingY, pathDomain, progress]);

  if (!svgPath || pathComponents.length === 0) return null;

  return (
    <>
      {pathComponents.map((component, idx) => {
        const Comp = mappingComponent[component.type];
        const position = positions[idx];
        return (
          <MemoizedPathComponent
            key={component.id}
            Comp={Comp}
            component={component}
            position={position}
            mapScale={mapScale}
          />
        );
      })}
    </>
  );
}

