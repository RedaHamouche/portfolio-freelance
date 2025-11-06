/**
 * Composant React pour le domaine Path
 * Utilise l'API du domaine Path pour rendre les composants
 */

"use client"
import React, { useState, useEffect, useMemo, memo } from 'react';
import mappingComponent from '../mappingComponent';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import classnames from 'classnames';
import { setProgress } from '../../store/scrollSlice';
import { getPointOnPath as getPointOnPathUtil } from '@/utils/pathCalculations';
import gsap from 'gsap';
import { createPathDomain } from '../domains/path';

interface DynamicPathComponentsProps {
  svgPath: SVGPathElement | null;
  paddingX: number;
  paddingY: number;
}

const DISTANCE_BEFORE_LOAD = 0.01;

// Hook utilitaire pour IntersectionObserver sur un tableau de refs
function useMultipleInView(refs: React.RefObject<HTMLDivElement | null>[], isNears: boolean[], threshold = DISTANCE_BEFORE_LOAD) {
  const [inViews, setInViews] = useState<boolean[]>(refs.map(() => false));

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    refs.forEach((ref, idx) => {
      if (!ref.current) return;
      if (!isNears[idx]) return; // N'observe que si potentiellement proche
      const observer = new window.IntersectionObserver(
        ([entry]) => {
          setInViews((prev) => {
            const copy = [...prev];
            copy[idx] = entry.isIntersecting;
            return copy;
          });
        },
        { threshold }
      );
      observer.observe(ref.current);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refs.length, isNears.join(',')]);

  return inViews;
}

interface MemoizedPathComponentProps {
  Comp: React.ComponentType<Record<string, unknown>>;
  component: Record<string, unknown> & { displayName: string; type: string };
  position: { x: number; y: number };
  refDiv: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
}

// Composant mémoïsé pour chaque élément du path
const MemoizedPathComponent = memo(function PathComponentMemo({ 
  Comp, 
  component, 
  position, 
  refDiv, 
  inView, 
  mapScale,
}: MemoizedPathComponentProps & { 
  mapScale: number;
}) {
  const { useEffect } = React;
  
  // Animer l'opacity avec GSAP pour de meilleures performances
  useEffect(() => {
    if (!refDiv.current) return;
    
    const targetOpacity = inView ? 1 : 0;
    
    // Utiliser GSAP pour animer l'opacity de manière performante
    gsap.to(refDiv.current, {
      opacity: targetOpacity,
      duration: 0.3,
      ease: 'power2.out',
    });
  }, [inView, refDiv]);
  
  return (
    <div
      data-name={`${component.displayName}-PATH-COMPONENT`}
      ref={refDiv}
      data-in-view={inView}
      className={classnames({ lazyLoadAnimation: inView })}
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        pointerEvents: 'auto',
        zIndex: 10,
        opacity: 0, // Initialisé à 0, GSAP gère l'animation
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

  // Utilise useMemo pour initialiser les refs une seule fois
  const refs = useMemo(
    () => pathComponents.map(() => React.createRef<HTMLDivElement>()),
    [pathComponents]
  );

  // Hook pour savoir si chaque composant est "actif" selon la range (mémoïsé)
  // Optimisé : calculer getActiveComponents une seule fois et utiliser un Set pour O(1) lookup
  const activeComponentIds = React.useMemo(() => {
    const activeComponents = pathDomain.getActiveComponents(progress, isDesktop);
    return new Set(activeComponents.map((c) => c.id));
  }, [progress, pathDomain, isDesktop]);

  const activeAnchors = React.useMemo(
    () => pathComponents.map((c) => activeComponentIds.has(c.id)),
    [pathComponents, activeComponentIds]
  );

  // Hook pour savoir si chaque ref est dans le viewport
  const inViews = useMultipleInView(refs, activeAnchors, 0.1);

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
            refDiv={refs[idx]}
            inView={inViews[idx]}
            mapScale={mapScale}
          />
        );
      })}
    </>
  );
}

