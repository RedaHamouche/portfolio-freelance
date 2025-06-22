import React, { Suspense, useState, useEffect, useMemo } from 'react';
import mappingComponent from './mappingComponent';
import config from './page.json';

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

  // State pour mémoriser les composants déjà chargés
  const [hasLoaded, setHasLoaded] = useState<Record<number, boolean>>({});

  // Utilise useMemo pour initialiser les refs une seule fois
  const refs = useMemo(
    () => config.components.map(() => React.createRef<HTMLDivElement>()),
    []
  );

  // Hook pour savoir si chaque ref est dans le viewport
  const inViews = useMultipleInView(refs, 0.1);

  // Met à jour hasLoaded si un composant est vu
  useEffect(() => {
    let updated = false;
    const newHasLoaded = { ...hasLoaded };
    inViews.forEach((inView, idx) => {
      if (inView && !newHasLoaded[idx]) {
        newHasLoaded[idx] = true;
        updated = true;
      }
    });
    if (updated) setHasLoaded(newHasLoaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inViews]);

  if (!config.components) return null;

  return (
    <>
      {config.components.map((item, idx) => {
        const Comp = mappingComponent[item.type];
        const loaded = hasLoaded[idx];
        const { position, ...rest } = item;
        const componentProps = { ...rest };
        return (
          <div
            key={idx}
            ref={refs[idx]}
            className={loaded ? 'lazyLoadAnimation' : ''}
            style={{
              position: 'absolute',
              top: position?.top,
              left: position?.left,
              pointerEvents: 'auto',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.5s',
            }}
          >
            {loaded && Comp && (
              <Suspense fallback={<div>Chargement...</div>}>
                <Comp {...componentProps} />
              </Suspense>
            )}
          </div>
        );
      })}
    </>
  );
} 