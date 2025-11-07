/**
 * Composant React pour le domaine Path
 * Utilise l'API du domaine Path pour rendre les composants
 */

"use client"
import React, { useEffect, useMemo, memo } from 'react';
import mappingComponent from '../mappingComponent';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { setProgress } from '../../store/scrollSlice';
import { getPointOnPath as getPointOnPathUtil } from '@/utils/pathCalculations';
import { createPathDomain } from '../domains/path';
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
  const isDesktop = useBreakpoint('>=desktop');
  const dispatch = useDispatch();

  // Créer une instance du domaine Path
  const pathDomain = useMemo(() => createPathDomain(), []);

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
  const getPointOnPath = React.useCallback((progressValue: number) => {
    if (!svgPath) return { x: 0, y: 0 };
    const point = getPointOnPathUtil(svgPath, progressValue, pathLength > 0 ? pathLength : undefined);
    return { x: point.x, y: point.y };
  }, [svgPath, pathLength]);

  // Refs supprimés - plus besoin d'IntersectionObserver pour l'opacity
  // activeAnchors et inViews supprimés - tous les composants sont toujours visibles

  // Mise à jour du hash dans l'URL quand un composant anchor devient actif
  // Utiliser useMemo pour calculer l'anchorId actif (évite les recalculs inutiles)
  const activeAnchorId = React.useMemo(() => {
    const activeComponents = pathDomain.getActiveComponents(progress, isDesktop);
    const firstActiveWithAnchor = activeComponents.find(c => c.anchorId);
    return firstActiveWithAnchor?.anchorId || null;
  }, [progress, pathDomain, isDesktop]);
  
  // Refs pour le throttling et le tracking
  const lastUpdatedAnchorIdRef = React.useRef<string | null>(null);
  const rafIdRef = React.useRef<number | null>(null);
  const lastUpdateTimeRef = React.useRef<number>(0);
  const pendingAnchorIdRef = React.useRef<string | null>(null);
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
        // OPTIMISATION: Vérifier si l'anchorId a changé avant de reprogrammer
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

  // Mémoïser toutes les positions d'un coup en utilisant l'API du domaine
  const positions = useMemo(
    () => pathComponents.map((component) => 
      pathDomain.calculateComponentPosition(component, getPointOnPath, paddingX, paddingY)
    ),
    [pathComponents, getPointOnPath, paddingX, paddingY, pathDomain]
  );

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

