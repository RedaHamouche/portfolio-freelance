"use client"
import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import BlackSquare from './BlackSquare';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

const PATH_SVG_URL = '/path.svg';
const POINT_ID = 'moving-point';
const SCROLL_PER_PX = 1.5; // 1px de scroll = 1.5px de chemin (ajuste ce ratio pour la sensation)
const MAP_SCALE = 0.3; // facteur de zoom (0.7 = 70%)

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pointRef = useRef<SVGCircleElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const [pathD, setPathD] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState<{width: number, height: number}>({width: 3000, height: 2000});
  const [pathLength, setPathLength] = useState<number>(2000);

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

  // Centrage initial et scroll à 0 au mount
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.background = '#fff';
    document.body.style.overflowX = 'hidden';
    window.scrollTo(0, 0);
    let ticking = false;
    const handleScroll = () => {
      const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      let scrollY = window.scrollY;
      // Scroll infini : replacer le scroll à l'autre extrémité si besoin
      if (scrollY <= 0) {
        window.scrollTo(0, maxScroll - 2); // -2 pour éviter de reboucler instantanément
        scrollY = maxScroll - 2;
      } else if (scrollY >= maxScroll - 1) {
        window.scrollTo(1, 1); // 1 pour éviter de reboucler instantanément
        scrollY = 1;
      }
      // Progression cyclique inversée
      const progress = 1 - (((scrollY / maxScroll) % 1 + 1) % 1); // toujours entre 0 et 1, inversé
      if (!svgRef.current || !pathRef.current || !mapWrapperRef.current) return;
      const path = pathRef.current;
      const totalLength = path.getTotalLength();
      const pos = path.getPointAtLength(progress * totalLength);
      // Centrer la map sur le point courant, en tenant compte du scale
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
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.background = '';
      document.body.style.overflowX = '';
    };
  }, [pathLength, svgSize]);

  // Faux scroll height dépendant de la longueur du chemin
  const fakeScrollHeight = Math.round(pathLength * SCROLL_PER_PX);

  return (
    <>
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
          {/* Carré noir centré sur la map */}
          <BlackSquare mapWidth={svgSize.width} mapHeight={svgSize.height} />
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