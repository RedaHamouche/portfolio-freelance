"use client"
import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
}

const SVG_WIDTH = 3000;
const SVG_HEIGHT = 2000;
const PATH_ID = 'main-path';
const POINT_ID = 'moving-point';
const FAKE_SCROLL_HEIGHT = 4000; // hauteur du faux scroll (plus grand = scroll plus long)

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pointRef = useRef<SVGCircleElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Centrage initial et scroll à 0 au mount
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.body.style.background = '#fff';
    document.body.style.overflowX = 'hidden';
    window.scrollTo(0, 0);
    // Centrage initial
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = FAKE_SCROLL_HEIGHT - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      if (!svgRef.current || !pathRef.current || !mapWrapperRef.current) return;
      const path = pathRef.current;
      const totalLength = path.getTotalLength();
      const pos = path.getPointAtLength(progress * totalLength);
      // Centrer la map sur le point courant
      const centerX = pos.x - window.innerWidth / 2;
      const centerY = pos.y - window.innerHeight / 2;
      mapWrapperRef.current.style.transform = `translate(${-centerX}px, ${-centerY}px)`;
      // Déplacer le point rouge
      if (pointRef.current) {
        pointRef.current.setAttribute('cx', pos.x.toString());
        pointRef.current.setAttribute('cy', pos.y.toString());
      }
    };
    window.addEventListener('scroll', handleScroll);
    // Centrage immédiat au mount
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.background = '';
      document.body.style.overflowX = '';
    };
  }, []);

  return (
    <>
      {/* Faux scroll vertical, dans le flux du body */}
      <div style={{ width: '100vw', height: FAKE_SCROLL_HEIGHT, position: 'relative', zIndex: 0 }} />
      {/* Map géante centrée sur le point courant, en fixed par-dessus */}
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, background: '#fff', margin: 0, padding: 0, zIndex: 1 }}>
        <div
          ref={mapWrapperRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SVG_WIDTH,
            height: SVG_HEIGHT,
            willChange: 'transform',
            zIndex: 2,
          }}
        >
          <svg
            ref={svgRef}
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            style={{ display: 'block', width: SVG_WIDTH, height: SVG_HEIGHT, background: '#fff' }}
          >
            <path
              id={PATH_ID}
              ref={pathRef}
              d="M 200 300 Q 800 100 1200 800 T 2500 1800"
              fill="none"
              stroke="#6ad7b3"
              strokeWidth={6}
              strokeDasharray="12 8"
            />
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