"use client"

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import styles from './index.module.scss';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Cursor from '../Cursor';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setIsScrolling, setProgress, setPathLength } from '../../store/scrollSlice';
import { setMapSize } from '../../store/mapSlice';
import Dynamic from '../../templating/Dynamic';
import DynamicPathComponents from '../../templating/DynamicPathComponents';
import pathComponents from '../../templating/pathComponents.json';
import PointTrail from './PointTrail';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, ScrollToPlugin);
}

const PATH_SVG_URL = '/path.svg';
const SCROLL_PER_PX = 1.5;
const MAP_SCALE = 1;

interface SvgSize {
  width: number;
  height: number;
}

interface PathComponentData {
  id: string;
  type: string;
  displayName: string;
  position: {
    progress: number;
    start: number;
    end: number;
  };
}

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const [pathD, setPathD] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState<SvgSize>({ width: 3000, height: 2000 });
  const [useNativeScroll, setUseNativeScroll] = useState<boolean>(true);
  const [dashOffset, setDashOffset] = useState<number>(0);
  const [nextComponent, setNextComponent] = useState<PathComponentData | null>(null);

  const direction = useSelector((state: RootState) => state.scroll.direction);
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const isAutoScrolling = useSelector((state: RootState) => state.scroll.isAutoScrolling);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const dispatch = useDispatch();

  // Référence pour accéder au state actuel dans les callbacks
  const progressRef = useRef(progress);
  const globalPathLengthRef = useRef(globalPathLength);
  
  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  
  useEffect(() => {
    globalPathLengthRef.current = globalPathLength;
  }, [globalPathLength]);

  // Fonction pour détecter la zone actuelle
  const getCurrentComponent = useCallback((currentProgress: number): PathComponentData | null => {
    return pathComponents.find((component: PathComponentData) => 
      currentProgress >= component.position.start && currentProgress <= component.position.end
    ) || null;
  }, []);

  // Mettre à jour la zone actuelle quand le progress change
  useEffect(() => {
    // Correction du sens : chercher le plus grand progress < progress actuel
    const sortedComponents = [...pathComponents].sort((a, b) => b.position.progress - a.position.progress);
    let findNext = sortedComponents.find(c => c.position.progress < progress);
    if (!findNext) {
      findNext = sortedComponents[0]; // boucle au "dernier" (le plus à droite)
    }
    setNextComponent(findNext);
  }, [progress, getCurrentComponent]);

  const handleScrollState = useCallback((isScrolling: boolean) => {
    dispatch(setIsScrolling(isScrolling));
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (isScrolling) {
      scrollTimeoutRef.current = setTimeout(() => {
        dispatch(setIsScrolling(false));
      }, 150);
    }
  }, [dispatch]);

  // Calculer le dashOffset en fonction du progress
  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      // Utiliser directement le progress pour un effet plus visible
      const newDashOffset = totalLength * progress;
      setDashOffset(newDashOffset);
      
      // Debug: afficher les valeurs
      console.log('Progress:', progress, 'DashOffset:', newDashOffset, 'TotalLength:', totalLength);
    }
  }, [progress]);

  // Fonction pour obtenir des points à des distances spécifiques sur le path
  const getPathPointsAtDistances = useCallback((distances: number[]) => {
    if (!pathRef.current) return [];
    
    const totalLength = pathRef.current.getTotalLength();
    return distances.map(distance => {
      const point = pathRef.current!.getPointAtLength(distance);
      return {
        x: point.x,
        y: point.y,
        distance: distance,
        progress: distance / totalLength
      };
    });
  }, []);

  // Exemple d'utilisation : obtenir des points tous les 25% du chemin
  useEffect(() => {
    if (pathRef.current) {
      const totalLength = pathRef.current.getTotalLength();
      const quarterPoints = [0, 0.25, 0.5, 0.75, 1].map(progress => 
        totalLength * progress
      );
      const points = getPathPointsAtDistances(quarterPoints);
      console.log('Points de distance sur le path:', points);
    }
  }, [globalPathLength, getPathPointsAtDistances]);

  useEffect(() => {
    fetch(PATH_SVG_URL)
      .then(res => res.text())
      .then(svgText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const path = doc.querySelector('path');
        const svg = doc.querySelector('svg');
        if (path && svg) {
          setPathD(path.getAttribute('d'));
          setSvgSize({
            width: Number(svg.getAttribute('width')) || 3000,
            height: Number(svg.getAttribute('height')) || 2000,
          });
        }
      })
      .catch(error => {
        console.error('Error loading SVG path:', error);
      });
  }, []);

  useLayoutEffect(() => {
    if (pathD && pathRef.current) {
      const newPathLength = pathRef.current.getTotalLength();
      dispatch(setPathLength(newPathLength));
    }
  }, [pathD, dispatch]);

  useEffect(() => {
    if (!useNativeScroll) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScrollState(true);
          const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
          const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
          let scrollY = window.scrollY;

          if (scrollY <= 0) {
            window.scrollTo(0, maxScroll - 2);
            scrollY = maxScroll - 2;
          } else if (scrollY >= maxScroll - 1) {
            window.scrollTo(1, 1);
            scrollY = 1;
          }

          const newProgress = computeScrollProgress(scrollY, maxScroll);
          dispatch(setProgress(newProgress));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [useNativeScroll, globalPathLength, handleScrollState, dispatch]);

  useEffect(() => {
    if (!direction) {
      setUseNativeScroll(true);
      return;
    }
    setUseNativeScroll(false);
    handleScrollState(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    let lastTimestamp: number | null = null;
    const move = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const pxPerMs = speed / 1000;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + (direction === 'bas' ? 1 : -1) * (pxPerMs * delta / globalPathLengthRef.current) + 1) % 1;
      dispatch(setProgress(newProgress));

      animationRef.current = requestAnimationFrame(move);
    };

    animationRef.current = requestAnimationFrame(move);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, speed, globalPathLength, handleScrollState, dispatch]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    if (!svgRef.current || !pathRef.current || !mapWrapperRef.current) return;
    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    const pos = path.getPointAtLength(progress * totalLength);

    const idealX = pos.x * MAP_SCALE - window.innerWidth / 2;
    const idealY = pos.y * MAP_SCALE - window.innerHeight / 2;
    const maxX = Math.max(0, svgSize.width * MAP_SCALE - window.innerWidth);
    const maxY = Math.max(0, svgSize.height * MAP_SCALE - window.innerHeight);
    const clampedX = Math.max(0, Math.min(idealX, maxX));
    const clampedY = Math.max(0, Math.min(idealY, maxY));

    const wrapper = mapWrapperRef.current;
    wrapper.style.transform = `translate(${-clampedX}px, ${-clampedY}px) scale(${MAP_SCALE})`;
    wrapper.style.transformOrigin = 'top left';
  }, [progress, svgSize]);

  const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);

  useEffect(() => {
    dispatch(setMapSize({ width: svgSize.width, height: svgSize.height }));
  }, [svgSize, dispatch]);

  // Calculer la position actuelle du point pour le texte
  const getCurrentPointPosition = () => {
    if (!pathRef.current) return { x: 200, y: 300 };
    const totalLength = pathRef.current.getTotalLength();
    const pos = pathRef.current.getPointAtLength(progress * totalLength);
    return { x: pos.x, y: pos.y };
  };

  // Calculer l'angle de tangente du path pour la rotation du point
  const getCurrentPointAngle = () => {
    if (!pathRef.current) return 0;
    const totalLength = pathRef.current.getTotalLength();
    const currentLength = progress * totalLength;
    const delta = 1; // px sur le path
    const p1 = pathRef.current.getPointAtLength(Math.max(0, currentLength - delta));
    const p2 = pathRef.current.getPointAtLength(Math.min(totalLength, currentLength + delta));
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    return angle;
  };

  const pointPosition = getCurrentPointPosition();
  const pointAngle = getCurrentPointAngle();

  // Calculer la position de la flèche (gauche ou droite)
  let arrowPosition: 'left' | 'right' = 'right';
  if (nextComponent) {
    if (nextComponent.position.progress < progress) {
      arrowPosition = 'left';
    } else {
      arrowPosition = 'right';
    }
  }

  const handleGoToNext = useCallback(() => {
    if (!nextComponent) return;

    const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    const targetScrollY = (1 - nextComponent.position.progress) * maxScroll;

    gsap.to(window, {
      scrollTo: {
        y: targetScrollY,
        autoKill: true
      },
      duration: 0.8,
      ease: 'power2.out'
    });
  }, [nextComponent, globalPathLength]);

  // Scroll automatique (play/pause)
  useEffect(() => {
    if (!isAutoScrolling) {
      // Quand on arrête le scroll automatique, synchroniser la position de scroll
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      const targetScrollY = (1 - progress) * maxScroll;
      window.scrollTo(0, targetScrollY);
      setUseNativeScroll(true);
      return;
    }
    
    // Désactiver le scroll manuel pendant le scroll automatique
    setUseNativeScroll(false);
    
    let raf: number;
    let lastTime = performance.now();
    const speed = 0.04; // 0.04 progress/seconde (ajuste si besoin)

    const animate = (now: number) => {
      if (!isAutoScrolling) return; // Vérifier encore une fois
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const currentProgress = progressRef.current;
      const newProgress = (currentProgress + autoScrollDirection * speed * dt) % 1;
      dispatch(setProgress(newProgress));
      
      // Synchroniser la position de scroll en temps réel
      const fakeScrollHeight = Math.round(globalPathLengthRef.current * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      const targetScrollY = (1 - newProgress) * maxScroll;
      window.scrollTo(0, targetScrollY);
      
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      // Réactiver le scroll manuel quand on arrête
      setUseNativeScroll(true);
    };
  }, [isAutoScrolling, progress, globalPathLength, dispatch, autoScrollDirection]);

  return (
    <div className={styles.main}>
      <Cursor />
      <div style={{ width: '100vw', height: fakeScrollHeight, position: 'relative', zIndex: 0 }} />
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, background: '#fff', margin: 0, padding: 0, zIndex: 1 }}>
        <div
          ref={mapWrapperRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: svgSize.width,
            height: svgSize.height,
            willChange: 'transform',
            zIndex: 2,
          }}
        >
          <Dynamic />
          <DynamicPathComponents 
            pathRef={pathRef}
          />
          <svg
            ref={svgRef}
            width={svgSize.width}
            height={svgSize.height}
            className={styles.mainSvg}
          >
            {pathD && (
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke="#6ad7b3"
                strokeWidth={6}
                strokeDasharray="20 10"
                className={styles.path}
                style={{ strokeDashoffset: dashOffset }}
              />
            )}
          </svg>
          <PointTrail 
            x={pointPosition.x}
            y={pointPosition.y}
            nextComponent={nextComponent}
            onGoToNext={handleGoToNext}
            angle={pointAngle}
            arrowPosition={arrowPosition}
          />
        </div>
      </div>
    </div>
  );
};

export default MapScroller;
