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
import { useProgressPersistence } from './hooks/useProgressPersistence';
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

  // Sauvegarder automatiquement le progress dans le localStorage
  useProgressPersistence();

  // Hooks personnalisés
  const {
    startDirectionalScroll,
    stopDirectionalScroll,
    startAutoScroll,
    stopAutoScroll
  } = useScrollManager(isScrollSynced);

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
    <main className={styles.main}>
      <Cursor />
      {/* Conteneur de scroll factice (crée la hauteur de scroll) */}
      <div style={{ width: '100vw', height: fakeScrollHeight, position: 'relative', zIndex: 0 }} />
      {/* Viewport fixe avec contexte de stacking isolé pour éviter le bug iOS 26 */}
      {/* Utilise position: fixed mais avec isolation et transform pour éviter les bugs */}
      <div 
        className={styles.viewportFixed}
        style={{ 
          width: '100vw', 
          height: '100dvh', 
          overflow: 'hidden', 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#fff', 
          margin: 0, 
          padding: 0, 
          zIndex: 1,
          // Créer un nouveau contexte de stacking pour éviter les bugs de layout iOS 26
          isolation: 'isolate',
          // GPU acceleration - force un nouveau layer
          transform: 'translateZ(0)',
          willChange: 'transform',
          // Forcer le repaint sur GPU
          backfaceVisibility: 'hidden',
          // Pointer events pour permettre les interactions
          pointerEvents: 'auto',
        }}
      >
        <MapViewport
          svgRef={svgRef}
          mapWrapperRef={mapWrapperRef}
          globalPathLength={globalPathLength}
        />
      </div>
    </main>
  );
};

export default MapScroller;
