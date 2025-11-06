import { useEffect, useRef, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { DynamicZoomUseCase } from './application';
import { ZoomService } from './domain';
import { DYNAMIC_ZOOM_CONFIG } from '@/config';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import gsap from 'gsap';

interface UseDynamicZoomOptions {
  baseScale: number;
  // Options optionnelles pour override la config
  zoomOutFactor?: number;
  animationDuration?: number;
  ease?: string;
  enabled?: boolean; // Override l'activation
}

/**
 * Hook pour gérer le zoom dynamique selon l'état du scroll
 * Dézoome légèrement pendant le scroll, revient au zoom normal après l'arrêt
 * Prend en compte l'inertie (le scroll s'arrête après l'easing)
 * 
 * @param options Configuration du zoom dynamique
 * @returns Le scale actuel (pour utilisation dans les calculs de viewport)
 */
export function useDynamicZoom({
  baseScale,
  zoomOutFactor,
  animationDuration,
  ease,
  enabled,
}: UseDynamicZoomOptions): number {
  // Récupérer l'état du scroll depuis Redux
  const isScrolling = useSelector((state: RootState) => state.scroll.isScrolling);
  const isDesktop = useBreakpoint('>=desktop');

  // Récupérer la configuration selon le breakpoint
  // Si default.enabled est false, cela désactive globalement (même si mobile/desktop ont enabled: true)
  // Sinon, utilise la configuration responsive (mobile/desktop)
  const config = useMemo(() => {
    const responsiveConfig = isDesktop ? DYNAMIC_ZOOM_CONFIG.desktop : DYNAMIC_ZOOM_CONFIG.mobile;
    const defaultConfig = DYNAMIC_ZOOM_CONFIG.default;
    
    // Si enabled est explicitement passé en paramètre, l'utiliser
    if (enabled !== undefined) {
      return {
        enabled,
        zoomOutFactor: zoomOutFactor ?? responsiveConfig.zoomOutFactor ?? defaultConfig.zoomOutFactor,
        animationDuration: animationDuration ?? responsiveConfig.animationDuration ?? defaultConfig.animationDuration,
        ease: ease ?? responsiveConfig.ease ?? defaultConfig.ease,
      };
    }
    
    // Si default.enabled est false, désactiver globalement
    if (!defaultConfig.enabled) {
      return {
        enabled: false,
        zoomOutFactor: zoomOutFactor ?? defaultConfig.zoomOutFactor,
        animationDuration: animationDuration ?? defaultConfig.animationDuration,
        ease: ease ?? defaultConfig.ease,
      };
    }
    
    // Sinon, utiliser la configuration responsive
    return {
      enabled: responsiveConfig.enabled,
      zoomOutFactor: zoomOutFactor ?? responsiveConfig.zoomOutFactor ?? defaultConfig.zoomOutFactor,
      animationDuration: animationDuration ?? responsiveConfig.animationDuration ?? defaultConfig.animationDuration,
      ease: ease ?? responsiveConfig.ease ?? defaultConfig.ease,
    };
  }, [isDesktop, zoomOutFactor, animationDuration, ease, enabled]);

  // Créer les services et use case (mémoïsés) - TOUJOURS appelés, même si disabled
  const zoomService = useMemo(() => new ZoomService(config.zoomOutFactor), [config.zoomOutFactor]);
  const useCaseRef = useRef<DynamicZoomUseCase | null>(null);
  if (!useCaseRef.current) {
    useCaseRef.current = new DynamicZoomUseCase(zoomService);
  }

  // State pour le scale actuel (nécessaire pour déclencher les re-renders du parent)
  const [currentScale, setCurrentScale] = useState(baseScale);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  // Mettre à jour l'état du scroll dans le use case
  useEffect(() => {
    if (!config.enabled) return;
    useCaseRef.current!.updateScrollState(isScrolling);
  }, [isScrolling, config.enabled]);

  // Animer le zoom de manière fluide
  useEffect(() => {
    // Si le zoom dynamique est désactivé, retourner le scale de base
    if (!config.enabled) {
      if (currentScale !== baseScale) {
        setCurrentScale(baseScale);
      }
      return;
    }

    const targetZoom = useCaseRef.current!.getCurrentZoom(baseScale);

    // Si le zoom n'a pas changé significativement, ne rien faire
    if (Math.abs(targetZoom - currentScale) < 0.001) {
      return;
    }

    // Tuer l'animation précédente si elle existe
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Créer un proxy pour animer le zoom
    const zoomProxy = { value: currentScale };

    // Animer vers le zoom cible
    animationRef.current = gsap.to(zoomProxy, {
      value: targetZoom,
      duration: config.animationDuration,
      ease: config.ease,
      overwrite: 'auto',
      onUpdate: () => {
        setCurrentScale(zoomProxy.value);
      },
      onComplete: () => {
        setCurrentScale(targetZoom);
        animationRef.current = null;
      },
    });

    // Cleanup
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, [baseScale, isScrolling, config.animationDuration, config.ease, config.enabled, currentScale]);

  // Initialiser le scale au baseScale si jamais il change significativement
  useEffect(() => {
    if (!config.enabled) return;
    if (Math.abs(currentScale - baseScale) > 0.1 && !isScrolling && !animationRef.current) {
      // Si le scale est très différent et qu'on ne scroll pas et qu'il n'y a pas d'animation, réinitialiser
      setCurrentScale(baseScale);
    }
  }, [baseScale, isScrolling, currentScale, config.enabled]);

  // Retourner le scale actuel ou baseScale si désactivé
  return config.enabled ? currentScale : baseScale;
}

