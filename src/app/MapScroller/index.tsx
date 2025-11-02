"use client"

import React, { useRef, useEffect, useMemo } from 'react';
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
import { LoadingScreen } from './components/LoadingScreen';
import { useScrollManager } from './hooks';
import { useScrollInitialization } from './hooks/useScrollInitialization';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { calculateFakeScrollHeight } from '@/utils/scrollCalculations';

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
  const { svgSize } = useResponsivePath();

  // Initialisation du scroll et synchronisation avec hash
  const isScrollSynced = useScrollInitialization(globalPathLength);

  // Hooks personnalisés
  const {
    startDirectionalScroll,
    stopDirectionalScroll,
    startAutoScroll,
    stopAutoScroll
  } = useScrollManager();

  // Mettre à jour la taille de la carte dans le store (responsive)
  useEffect(() => {
    dispatch(setMapSize({ width: svgSize.width, height: svgSize.height }));
  }, [dispatch, svgSize]);

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

  // Calculer la hauteur du scroll factice (mémoïsé pour éviter recalculs)
  const fakeScrollHeight = useMemo(
    () => calculateFakeScrollHeight(globalPathLength),
    [globalPathLength]
  );

  // Gestion du loading
  if (!isScrollSynced) {
    return <LoadingScreen />;
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
