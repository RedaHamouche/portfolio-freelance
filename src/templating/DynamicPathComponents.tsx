"use client"
import React, { useState, useEffect, useMemo, memo } from 'react';
import mappingComponent from './mappingComponent';
import pathComponents from './pathComponents.json';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { MAP_SCALE } from '@/config/mapScale';
import classnames from 'classnames';
import { setProgress } from '../store/scrollSlice';
import { ANCHOR_RANGE } from '@/config/anchorRange';

interface DynamicPathComponentsProps {
  svgPath: SVGPathElement | null;
  paddingX: number;
  paddingY: number;
}

// interface PathComponent {
//   id: string;
//   type: string;
//   displayName: string;
//   position: {
//     progress: number;
//     start: number;
//     end: number;
//   };
// }

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
  component: Record<string, unknown> & { displayName: string };
  position: { x: number; y: number };
  refDiv: React.RefObject<HTMLDivElement | null>;
  inView: boolean;
}

// Composant mémoïsé pour chaque élément du path
const MemoizedPathComponent = memo(function PathComponentMemo({ Comp, component, position, refDiv, inView }: MemoizedPathComponentProps) {
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
        opacity: inView ? 1 : 0,
        transition: 'opacity 0.3s',
        transform: `translate(-50%, -50%) scale(${1 / MAP_SCALE})`,
        transformOrigin: 'center',
      }}
    >
      {Comp && <Comp {...component} />}
    </div>
  );
});

export default function DynamicPathComponents({ svgPath, paddingX, paddingY }: DynamicPathComponentsProps) {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const dispatch = useDispatch();

  // Gestion du deeplink (hash)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const anchorComponent = pathComponents.find(c => c.anchorId === hash);
      if (anchorComponent && anchorComponent.position && typeof anchorComponent.position.progress === 'number') {
        dispatch(setProgress(anchorComponent.position.progress));
      }
    };
    // On gère au chargement
    handleHash();
    // On gère si le hash change
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [dispatch]);

  // Mémoïser la longueur totale du path
  const totalLength = useMemo(() => {
    return svgPath ? svgPath.getTotalLength() : 0;
  }, [svgPath]);

  // Mémoïser la fonction getPositionOnPath pour éviter les re-créations
  const getPositionOnPath = React.useCallback((progressValue: number) => {
    if (!svgPath) return { x: 0, y: 0 };
    const position = svgPath.getPointAtLength(progressValue * totalLength);
    return { x: position.x + paddingX, y: position.y + paddingY };
  }, [svgPath, totalLength, paddingX, paddingY]);

  // Utilise useMemo pour initialiser les refs une seule fois
  const refs = useMemo(
    () => pathComponents.map(() => React.createRef<HTMLDivElement>()),
    []
  );

  // Hook pour savoir si chaque composant est "actif" selon la range
  const activeAnchors = pathComponents.map(
    (component) => {
      const anchorProgress = component.position.progress;
      return Math.abs(progress - anchorProgress) <= ANCHOR_RANGE / 2;
    }
  );

  // Hook pour savoir si chaque ref est dans le viewport (ici, on peut aussi utiliser activeAnchors comme critère)
  const inViews = useMultipleInView(refs, activeAnchors, 0.1);

  // Mise à jour du hash dans l'URL quand un composant anchor devient actif
  useEffect(() => {
    const firstActiveIdx = activeAnchors.findIndex((v, idx) => v && pathComponents[idx].anchorId);
    if (firstActiveIdx !== -1) {
      const anchorId = pathComponents[firstActiveIdx].anchorId;
      if (anchorId && window.location.hash.replace('#', '') !== anchorId) {
        history.replaceState(null, '', `#${anchorId}`);
      }
    } else {
      // Aucun composant actif, on retire le hash
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [activeAnchors]);

  // Mémoïser toutes les positions d'un coup
  const positions = useMemo(
    () => pathComponents.map((component) => getPositionOnPath(component.position.progress)),
    [getPositionOnPath]
  );

  if (!svgPath || !pathComponents) return null;

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
          />
        );
      })}
    </>
  );
} 