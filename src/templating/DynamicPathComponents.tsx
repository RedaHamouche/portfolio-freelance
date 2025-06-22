"use client"
import React, { useState, useEffect, useMemo } from 'react';
import mappingComponent from './mappingComponent';
import pathComponents from './pathComponents.json';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface DynamicPathComponentsProps {
  pathRef: React.RefObject<SVGPathElement | null>;
}

interface PathComponent {
  id: string;
  type: string;
  displayName: string;
  position: {
    progress: number;
    start: number;
    end: number;
  };
}

const DISTANCE_BEFORE_LOAD = 0.005;

// Hook utilitaire pour IntersectionObserver sur un tableau de refs
function useMultipleInView(refs: React.RefObject<HTMLDivElement | null>[], isNears: boolean[], threshold = 0.1) {
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

export default function DynamicPathComponents({ pathRef }: DynamicPathComponentsProps) {
  const progress = useSelector((state: RootState) => state.scroll.progress);

  const getPositionOnPath = (progressValue: number) => {
    const path = pathRef.current;
    if (!path) return { x: 0, y: 0 };
    const totalLength = path.getTotalLength();
    const position = path.getPointAtLength(progressValue * totalLength);
    return { x: position.x, y: position.y };
  };

  // Utilise useMemo pour initialiser les refs une seule fois
  const refs = useMemo(
    () => pathComponents.map(() => React.createRef<HTMLDivElement>()),
    []
  );

  // Calcule pour chaque composant s'il est proche du point
  const isNears = pathComponents.map(
    (component) => Math.abs(progress - component.position.progress) < 0.1
  );

  // Hook pour savoir si chaque ref est dans le viewport (ici, on peut aussi utiliser isNears comme critère)
  const inViews = useMultipleInView(refs, isNears, 0.1);

  if (!pathRef.current || !pathComponents) return null;

  return (
    <>
      {pathComponents.map((component, idx) => {
        const Comp = mappingComponent[component.type];
        const position = getPositionOnPath(component.position.progress);
        return (
          <div
            data-name={`${component.displayName}-PATH-COMPONENT`}
            key={component.id}
            ref={refs[idx]}
            className={inViews[idx] ? 'lazyLoadAnimation' : ''}
            style={{
              position: 'absolute',
              top: position.y,
              left: position.x,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              zIndex: 10,
              opacity: inViews[idx] ? 1 : 0,
              transition: 'opacity 0.5s',
            }}
          >
            {Comp && <Comp {...component} />}
          </div>
        );
      })}
    </>
  );
} 