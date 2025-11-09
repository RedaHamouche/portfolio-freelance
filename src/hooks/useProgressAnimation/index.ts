/**
 * Hook pour animer des composants basé sur le progress du scroll
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { loadGSAP } from '@/utils/gsap/lazyLoadGSAP';
import { UseProgressAnimationConfig, AnimationState, AnimationConfig } from './types';
import { createInitialAnimationState } from './utils';
import { getAnimation } from './animations';
import { AnimationContext } from './animations/base';

/**
 * Hook principal pour les animations basées sur le progress
 */
export function useProgressAnimation<T extends HTMLElement = HTMLDivElement>(
  config: UseProgressAnimationConfig
) {
  const elementRef = useRef<T>(null);
  const animationStateRef = useRef<AnimationState>(createInitialAnimationState());
  const [gsap, setGSAP] = useState<typeof import('gsap')['default'] | null>(null);
  const quickSettersRef = useRef<{
    x?: (value: number) => void;
    y?: (value: number) => void;
    opacity?: (value: number) => void;
    scaleX?: (value: number) => void;
    scaleY?: (value: number) => void;
    rotation?: (value: number) => void;
  }>({});

  // Référence pour tracker les animations complexes initialisées
  const complexAnimationsSetupRef = useRef<Set<string>>(new Set());

  // Lazy load GSAP
  useEffect(() => {
    loadGSAP().then((loadedGSAP) => {
      setGSAP(loadedGSAP);
    });
  }, []);

  // Récupérer le progress et la direction depuis Redux
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const direction = useSelector((state: RootState) => state.scroll.lastScrollDirection);

  // Créer le contexte d'animation
  const animationContext: AnimationContext = useMemo(() => ({
    progress,
    direction,
    elementRef: elementRef as React.RefObject<HTMLElement>,
  }), [progress, direction]);

  // Initialiser les quickSetters GSAP une seule fois
  useEffect(() => {
    if (!elementRef.current || !gsap) return;

    // Créer les quickSetters pour des performances optimales
    // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
    quickSettersRef.current = {
      x: gsap.quickTo(elementRef.current, 'x', {
        duration: 0.3,
        ease: 'power2.out',
      }),
      y: gsap.quickTo(elementRef.current, 'y', {
        duration: 0.3,
        ease: 'power2.out',
      }),
      opacity: gsap.quickTo(elementRef.current, 'opacity', {
        duration: 0.2,
        ease: 'power2.out',
      }),
      scaleX: gsap.quickTo(elementRef.current, 'scaleX', {
        duration: 0.3,
        ease: 'power2.out',
      }),
      scaleY: gsap.quickTo(elementRef.current, 'scaleY', {
        duration: 0.3,
        ease: 'power2.out',
      }),
      rotation: gsap.quickTo(elementRef.current, 'rotation', {
        duration: 0.3,
        ease: 'power2.out',
      }),
    };

    // Initialiser les valeurs par défaut
    // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
    gsap.set(elementRef.current, {
      x: 0,
      y: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    });
  }, [gsap]);

  // Calculer les valeurs d'animation
  const animationValues = useMemo(() => {
    if (!elementRef.current) return animationStateRef.current;

    let newState: AnimationState = { ...animationStateRef.current };

    // Appliquer chaque animation configurée via le registre
    config.animations.forEach((animationConfig) => {
      if (animationConfig.enabled === false) return;

      const animation = getAnimation(animationConfig.type);
      if (!animation) {
        console.warn(`Animation type "${animationConfig.type}" not found in registry`);
        return;
      }

      // Si l'animation a une fonction calculate, l'utiliser
      if ('calculate' in animation && animation.calculate) {
        const result = animation.calculate(
          newState,
          animationContext,
          animationConfig as AnimationConfig
        );
        newState = { ...newState, ...result };
      }
    });

    // Mettre à jour le state
    animationStateRef.current = newState;
    
    return newState;
  }, [config, animationContext]);

  // Setup des animations complexes (une seule fois)
  useEffect(() => {
    if (!elementRef.current) return;

    config.animations.forEach((animationConfig) => {
      if (animationConfig.enabled === false) return;
      if (complexAnimationsSetupRef.current.has(animationConfig.type)) return;

      const animation = getAnimation(animationConfig.type);
      if (!animation || !('setup' in animation) || !animation.setup) return;

      animation.setup(elementRef as React.RefObject<HTMLElement>);
      complexAnimationsSetupRef.current.add(animationConfig.type);
    });
  }, [config]);

  // Update des animations complexes (à chaque changement de progress)
  useEffect(() => {
    if (!elementRef.current) return;

    config.animations.forEach(async (animationConfig) => {
      if (animationConfig.enabled === false) return;

      const animation = getAnimation(animationConfig.type);
      if (!animation || !('update' in animation) || !animation.update) return;

      if (!complexAnimationsSetupRef.current.has(animationConfig.type)) return;

      // Support des fonctions update asynchrones (pour lazy load GSAP)
      const result = animation.update(elementRef as React.RefObject<HTMLElement>, animationContext, animationConfig as AnimationConfig);
      if (result instanceof Promise) {
        await result;
      }
    });
  }, [progress, config, animationContext]);

  // Appliquer les animations avec GSAP
  useEffect(() => {
    if (!elementRef.current) return;

    const { x, y, opacity, scale, rotation } = animationValues;
    const { x: setX, y: setY, opacity: setOpacity, scaleX: setScaleX, scaleY: setScaleY, rotation: setRotation } = quickSettersRef.current;

    // Appliquer les valeurs avec les quickSetters (haute performance)
    // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
    if (setX && x !== undefined) setX(x);
    if (setY && y !== undefined) setY(y);
    if (setOpacity && opacity !== undefined) setOpacity(opacity);
    if (setScaleX && scale !== undefined) setScaleX(scale);
    if (setScaleY && scale !== undefined) setScaleY(scale);
    if (setRotation && rotation !== undefined) setRotation(rotation);
  }, [animationValues]);

  return elementRef;
}
