"use client"

import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import styles from './index.module.scss';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import Cursor from '../Cursor';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setIsScrolling } from '../../store/scrollSlice';
import { setMapSize } from '../../store/mapSlice';
import Dynamic from '../../templating/Dynamic';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

const PATH_SVG_URL = '/path.svg';
const POINT_ID = 'moving-point';
const SCROLL_PER_PX = 1.5;
const MAP_SCALE = 1;

interface SvgSize {
  width: number;
  height: number;
}

const computeScrollProgress = (scrollY: number, maxScroll: number): number => {
  return 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
};

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pointRef = useRef<SVGCircleElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const [pathD, setPathD] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState<SvgSize>({ width: 3000, height: 2000 });
  const [pathLength, setPathLength] = useState<number>(2000);
  const [progress, setProgress] = useState<number>(0);
  const [useNativeScroll, setUseNativeScroll] = useState<boolean>(true);
  const [dashOffset, setDashOffset] = useState<number>(0);
  const [distancePoints, setDistancePoints] = useState<Array<{x: number, y: number, distance: number, progress: number}>>([]);

  const direction = useSelector((state: RootState) => state.scroll.direction);
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const dispatch = useDispatch();

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
  }, [pathLength, getPathPointsAtDistances]);

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
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  useEffect(() => {
    if (!useNativeScroll) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScrollState(true);
          const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);
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
          setProgress(newProgress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [useNativeScroll, pathLength, handleScrollState]);

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
      setProgress(prevProgress => {
        let newProgress = prevProgress + (direction === 'bas' ? 1 : -1) * (pxPerMs * delta / pathLength);
        return (newProgress + 1) % 1;
      });

      animationRef.current = requestAnimationFrame(move);
    };

    animationRef.current = requestAnimationFrame(move);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, speed, pathLength, handleScrollState]);

  useEffect(() => {
    if (!direction && !useNativeScroll) {
      const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      let scrollY = window.scrollY;
      if (scrollY <= 0) scrollY = maxScroll - 2;
      else if (scrollY >= maxScroll - 1) scrollY = 1;
      const newProgress = computeScrollProgress(scrollY, maxScroll);
      setProgress(newProgress);
      setUseNativeScroll(true);
    }
  }, [direction, useNativeScroll, pathLength]);

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

    if (pointRef.current) {
      pointRef.current.setAttribute('cx', pos.x.toString());
      pointRef.current.setAttribute('cy', pos.y.toString());
    }
  }, [progress, svgSize]);

  const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);

  useEffect(() => {
    dispatch(setMapSize({ width: svgSize.width, height: svgSize.height }));
  }, [svgSize, dispatch]);

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
          <Dynamic mapWidth={svgSize.width} mapHeight={svgSize.height} />
          <svg
            ref={svgRef}
            width={svgSize.width}
            height={svgSize.height}
            style={{ display: 'block', background: '#fff' }}
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
            <circle
              id={POINT_ID}
              ref={pointRef}
              r={24}
              fill="#f44336"
              stroke="#fff"
              strokeWidth={4}
              cx={200}
              cy={300}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MapScroller;
