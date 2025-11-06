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

  // Gestion du deeplink (hash)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const anchorComponent = pathDomain.getComponentByAnchorId(hash, isDesktop);
      if (anchorComponent && anchorComponent.position && typeof anchorComponent.position.progress === 'number') {
        dispatch(setProgress(anchorComponent.position.progress));
      }
    };
    // On gère au chargement
    handleHash();
    // On gère si le hash change
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [dispatch, pathDomain, isDesktop]);

  // Récupérer pathLength du store pour optimiser getPointOnPath
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);

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
  useEffect(() => {
    const activeComponents = pathDomain.getActiveComponents(progress, isDesktop);
    const firstActiveWithAnchor = activeComponents.find(c => c.anchorId);
    if (firstActiveWithAnchor?.anchorId) {
      const anchorId = firstActiveWithAnchor.anchorId;
      if (window.location.hash.replace('#', '') !== anchorId) {
        history.replaceState(null, '', `#${anchorId}`);
      }
    } else {
      // Aucun composant actif, on retire le hash
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [progress, pathDomain, isDesktop]);

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

