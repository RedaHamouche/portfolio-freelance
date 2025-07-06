"use client"

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import styles from './index.module.scss';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Cursor from '../Cursor';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setMapSize } from '@/store/mapSlice';
import { MapViewport } from './components';
import { useScrollManager } from './hooks';
import pathComponents from '@/templating/pathComponents.json';
import { SCROLL_CONFIG } from '@/config/scroll';
import { SVG_SIZE } from '@/config/path';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, ScrollToPlugin);
}

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);
  const direction = useSelector((state: RootState) => state.scroll.direction);
  const dispatch = useDispatch();

  // Nouvel état pour bloquer le rendu tant que la synchro n'est pas faite
  const [isScrollSynced, setIsScrollSynced] = useState(false);

  // Hooks personnalisés
  const {
    startDirectionalScroll,
    stopDirectionalScroll,
    startAutoScroll,
    stopAutoScroll
  } = useScrollManager();

  // Synchroniser le scroll natif avec l'anchorId au tout début
  useEffect(() => {
    // On attend que la longueur du path soit connue
    if (!globalPathLength) return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      setIsScrollSynced(true);
      return;
    }
    const anchorComponent = pathComponents.find(c => c.anchorId === hash);
    if (anchorComponent && anchorComponent.position && typeof anchorComponent.position.progress === 'number') {
      const progress = anchorComponent.position.progress;
      const fakeScrollHeight = Math.round(globalPathLength * SCROLL_CONFIG.SCROLL_PER_PX);
      const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
      const targetScrollY = (1 - progress) * maxScroll;
      window.scrollTo(0, targetScrollY);
    }
    setIsScrollSynced(true);
  }, [globalPathLength]);

  // Mettre à jour la taille de la carte dans le store
  useEffect(() => {
    dispatch(setMapSize({ width: SVG_SIZE.width, height: SVG_SIZE.height }));
  }, [dispatch]);

  // Gérer le scroll directionnel (clavier/boutons)
  useEffect(() => {
    if (direction) {
      startDirectionalScroll();
      return stopDirectionalScroll;
    }
    return undefined;
  }, [direction, startDirectionalScroll, stopDirectionalScroll]);

  // Gérer l'auto-scroll (play/pause)
  useEffect(() => {
    if (isAutoPlaying) {
      startAutoScroll();
      return stopAutoScroll;
    }
    return undefined;
  }, [isAutoPlaying, startAutoScroll, stopAutoScroll]);

  // Calculer la hauteur du scroll factice
  const fakeScrollHeight = Math.round(globalPathLength * 1.5);

  // Gestion du loading
  if (!isScrollSynced) {
    return (
      <div className={styles.main}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Chargement de la carte...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <Cursor />
      <div style={{ width: '100vw', height: fakeScrollHeight, position: 'relative', zIndex: 0 }} />
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, background: '#fff', margin: 0, padding: 0, zIndex: 1 }}>
        <MapViewport
          svgRef={svgRef}
          mapWrapperRef={mapWrapperRef}
          globalPathLength={globalPathLength}
        />
      </div>
    </div>
  );
};

export default MapScroller;
