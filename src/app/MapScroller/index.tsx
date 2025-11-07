"use client"

import React, { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import styles from './index.module.scss';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
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
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  
  // Configurer ScrollTrigger pour ignorer les changements de taille causés par la barre Safari
  // Cela évite les recalculs qui causent le path de disparaître quand la barre Safari bouge
  ScrollTrigger.config({ ignoreMobileResize: true });
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
      {/* Viewport fixe pour afficher la carte */}
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
          // NOTE: isolation retiré pour éviter le bug Safari iOS où le contenu disparaît quand progress = 0
          // isolation: 'isolate',
          // GPU acceleration - force un nouveau layer (utilise translate3d pour meilleure compatibilité iOS)
          transform: 'translate3d(0, 0, 0)',
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
