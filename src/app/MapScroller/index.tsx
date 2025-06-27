"use client"

import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import styles from './index.module.scss';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Cursor from '../Cursor';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setPathLength } from '../../store/scrollSlice';
import { setMapSize } from '../../store/mapSlice';
import { MapViewport } from './components';
import { usePathLoader, useScrollManager } from './hooks';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, ScrollToPlugin);
}

const MapScroller: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  
  const [useNativeScroll, setUseNativeScroll] = useState<boolean>(true);

  const globalPathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);
  const direction = useSelector((state: RootState) => state.scroll.direction);
  const dispatch = useDispatch();

  // Hooks personnalisés
  const { pathD, svgSize, isLoading, error } = usePathLoader();
  const { setupManualScroll, setupDirectionalScroll, setupAutoScroll } = useScrollManager();

  // Mettre à jour la longueur du path dans le store
  useEffect(() => {
    if (pathD && pathRef.current) {
      const newPathLength = pathRef.current.getTotalLength();
      dispatch(setPathLength(newPathLength));
    }
  }, [pathD, dispatch]);

  // Mettre à jour la taille de la carte dans le store
  useEffect(() => {
    dispatch(setMapSize({ width: svgSize.width, height: svgSize.height }));
  }, [svgSize, dispatch]);

  // Gérer le scroll manuel
  useEffect(() => {
    if (!direction) {
      setUseNativeScroll(true);
      return;
    }
    setUseNativeScroll(false);
  }, [direction]);

  // Setup des différents types de scroll
  useEffect(() => {
    const cleanupManual = setupManualScroll(useNativeScroll);
    return cleanupManual;
  }, [useNativeScroll, setupManualScroll]);

  useEffect(() => {
    const cleanupDirectional = setupDirectionalScroll();
    return cleanupDirectional;
  }, [setupDirectionalScroll]);

  useEffect(() => {
    const cleanupAuto = setupAutoScroll();
    return cleanupAuto;
  }, [isAutoPlaying, setupAutoScroll]);

  // Gérer la transition entre scroll automatique et manuel
  useEffect(() => {
    if (!isAutoPlaying) {
      setUseNativeScroll(true);
    } else {
      setUseNativeScroll(false);
    }
  }, [isAutoPlaying]);

  // Calculer la hauteur du scroll factice
  const fakeScrollHeight = Math.round(globalPathLength * 1.5);

  // Gestion des erreurs et loading
  if (error) {
    return (
      <div className={styles.main}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Erreur de chargement: {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
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
          svgSize={svgSize}
          pathD={pathD}
          pathRef={pathRef}
          svgRef={svgRef}
          mapWrapperRef={mapWrapperRef}
          globalPathLength={globalPathLength}
        />
      </div>
    </div>
  );
};

export default MapScroller;
