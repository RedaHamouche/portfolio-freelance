"use client"
import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import Cursor from '../Cursor';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setIsScrolling } from '../../store/scrollSlice';
import Dynamic from '../../templating/Dynamic';
import { setMapSize } from '../../store/mapSlice';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

const PATH_SVG_URL = '/path.svg';
const POINT_ID = 'moving-point';
const SCROLL_PER_PX = 1.5; // 1px de scroll = 1.5px de chemin (ajuste ce ratio pour la sensation)
const MAP_SCALE = 1; // facteur de zoom (0.7 = 70%)

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pointRef = useRef<SVGCircleElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [pathD, setPathD] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState<{width: number, height: number}>({width: 3000, height: 2000});
  const [pathLength, setPathLength] = useState<number>(2000);
  const direction = useSelector((state: RootState) => state.scroll.direction);
  const speed = useSelector((state: RootState) => state.scroll.scrollingSpeed);
  const animationRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0); // progress sur le chemin (0-1)
  const [useNativeScroll, setUseNativeScroll] = useState(true);

  const dispatch = useDispatch();

  // Fonction pour gérer isScrolling avec timeout
  const handleScrollState = (isScrolling: boolean) => {
    dispatch(setIsScrolling(isScrolling));
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    if (isScrolling) {
      // Remettre isScrolling à false après 150ms d'inactivité
      scrollTimeoutRef.current = setTimeout(() => {
        dispatch(setIsScrolling(false));
      }, 150);
    }
  };

  // Charger le SVG et extraire le premier chemin <path>
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
      });
  }, []);

  // Calculer la longueur du chemin une fois le d chargé
  useEffect(() => {
    if (pathD && pathRef.current) {
      setTimeout(() => {
        setPathLength(pathRef.current!.getTotalLength());
      }, 0);
    }
  }, [pathD]);

  // Progress natif (scroll) et progress animé (cadre)
  useEffect(() => {
    if (!useNativeScroll) return;
    const handleScroll = () => {
      handleScrollState(true); // Indiquer qu'on scrolle
      
      const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      let scrollY = window.scrollY;
      // Scroll infini : replacer le scroll à l'autre extrémité si besoin
      if (scrollY <= 0) {
        window.scrollTo(0, maxScroll - 2);
        scrollY = maxScroll - 2;
      } else if (scrollY >= maxScroll - 1) {
        window.scrollTo(1, 1);
        scrollY = 1;
      }
      // Progression cyclique inversée
      const progress = 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
      setProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [useNativeScroll, pathLength, svgSize]);

  // Mouvement automatique selon la direction du cadre (haut/bas uniquement)
  useEffect(() => {
    if (!direction) {
      setUseNativeScroll(true); // réactive le scroll natif
      return;
    }
    setUseNativeScroll(false); // désactive le scroll natif
    handleScrollState(true); // Indiquer qu'on scrolle avec le cadre
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    let lastTimestamp: number | null = null;
    const move = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      // Vitesse de déplacement (ajustable)
      const pxPerMs = speed / 1000; // px/ms
      let newProgress = progress;
      // Déterminer le sens selon la direction
      if (direction === 'bas') {
        newProgress += pxPerMs * delta / pathLength;
      } else if (direction === 'haut') {
        newProgress -= pxPerMs * delta / pathLength;
      }
      // Boucle infinie
      if (newProgress > 1) newProgress -= 1;
      if (newProgress < 0) newProgress += 1;
      setProgress(newProgress);
      animationRef.current = requestAnimationFrame(move);
    };
    animationRef.current = requestAnimationFrame(move);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [direction, speed, pathLength, progress]);

  // Quand on quitte le hover, resynchroniser le progress avec le scroll natif
  useEffect(() => {
    if (!direction && !useNativeScroll) {
      // Synchronise le progress avec la position du scroll natif
      const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      let scrollY = window.scrollY;
      if (scrollY <= 0) scrollY = maxScroll - 2;
      else if (scrollY >= maxScroll - 1) scrollY = 1;
      const progress = 1 - (((scrollY / maxScroll) % 1 + 1) % 1);
      setProgress(progress);
      setUseNativeScroll(true);
    }
  }, [direction, useNativeScroll, pathLength]);

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Appliquer le progress calculé par le cadre OU par le scroll
  useEffect(() => {
    if (!svgRef.current || !pathRef.current || !mapWrapperRef.current) return;
    const path = pathRef.current;
    const totalLength = path.getTotalLength();
    const pos = path.getPointAtLength(progress * totalLength);
    // Centrage de la map
    const idealX = pos.x * MAP_SCALE - window.innerWidth / 2;
    const idealY = pos.y * MAP_SCALE - window.innerHeight / 2;
    const minX = 0;
    const minY = 0;
    const maxX = Math.max(0, svgSize.width * MAP_SCALE - window.innerWidth);
    const maxY = Math.max(0, svgSize.height * MAP_SCALE - window.innerHeight);
    const clampedX = Math.max(minX, Math.min(idealX, maxX));
    const clampedY = Math.max(minY, Math.min(idealY, maxY));
    mapWrapperRef.current.style.transform = `translate(${-clampedX}px, ${-clampedY}px) scale(${MAP_SCALE})`;
    mapWrapperRef.current.style.transformOrigin = 'top left';
    // Déplacer le point rouge
    if (pointRef.current) {
      pointRef.current.setAttribute('cx', pos.x.toString());
      pointRef.current.setAttribute('cy', pos.y.toString());
    }
  }, [progress, svgSize, pathLength]);

  // Faux scroll height dépendant de la longueur du chemin
  const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);

  useEffect(() => {
    dispatch(setMapSize({ width: svgSize.width, height: svgSize.height }));
  }, [svgSize, dispatch]);

  return (
    <>
      {/* Cursor interactif au-dessus de tout */}
      <Cursor />
      {/* Cadre directionnel */}
      {/* <Cadre /> */}
      {/* Faux scroll vertical, dans le flux du body */}
      <div style={{ width: '100vw', height: fakeScrollHeight, position: 'relative', zIndex: 0 }} />
      {/* Map géante centrée sur le point courant, en fixed par-dessus */}
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
            style={{ display: 'block', width: svgSize.width, height: svgSize.height, background: '#fff' }}
          >
            {pathD && (
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke="#6ad7b3"
                strokeWidth={6}
                strokeDasharray="12 8"
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
    </>
  );
};

export default MapScroller; 