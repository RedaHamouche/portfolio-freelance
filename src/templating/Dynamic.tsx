import React, { useState, useEffect, useMemo } from 'react';
import mappingComponent from './mappingComponent';
import config from './page.json';
import { MAP_SCALE } from '@/config';
import classnames from 'classnames';

// Hook utilitaire pour IntersectionObserver sur un tableau de refs
function useMultipleInView(refs: React.RefObject<HTMLDivElement | null>[], threshold = 0.1) {
  const [inViews, setInViews] = useState<boolean[]>(refs.map(() => false));

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    refs.forEach((ref, idx) => {
      if (!ref.current) return;
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
  }, [refs.length]);

  return inViews;
}

type DynamicProps = Record<string, never>;

export default function Dynamic({}: DynamicProps) {


  // Utilise useMemo pour initialiser les refs une seule fois
  const refs = useMemo(
    () => config.components.map(() => React.createRef<HTMLDivElement>()),
    []
  );

  // Hook pour savoir si chaque ref est dans le viewport
  const inViews = useMultipleInView(refs, 0.1);

  if (!config.components) return null;

  return (
    <>
      {config.components.map((item, idx) => {
        const Comp = mappingComponent[item.type];
        const { position, ...rest } = item;
        const componentProps = { ...rest };
        return (
          <div
            key={idx}
            ref={refs[idx]}
            className={classnames({ lazyLoadAnimation: inViews[idx] })}
            style={{
              position: 'absolute',
              top: position?.top,
              left: position?.left,
              pointerEvents: 'auto',
              opacity: inViews[idx] ? 1 : 0,
              transition: 'opacity 0.5s',
              transform: `scale(${1 / MAP_SCALE})`,
              transformOrigin: 'top left',
            }}
          >
            {Comp && <Comp {...componentProps} />}
          </div>
        );
      })}
    </>
  );
} 