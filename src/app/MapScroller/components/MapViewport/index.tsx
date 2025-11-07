import { useLayoutEffect, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setPathLength } from '@/store/scrollSlice';
import Dynamic from '@/templating/components/Dynamic';
import DynamicPathComponents from '@/templating/components/DynamicPathComponents';
import DynamicPathTangenteComponents from '@/templating/components/DynamicPathTangenteComponents';
import { SvgPath } from '@/app/MapScroller/components/SvgPath';
import PointTrail from '@/app/MapScroller/PointTrail';
import { SvgPathDebugger } from '@/components/SvgPathDebugger';
import { usePathCalculations } from '@/app/MapScroller/hooks/usePathCalculations';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { useDynamicZoom } from '@/app/MapScroller/hooks/useDynamicZoom';
import gsap from 'gsap';
import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';
import { MapViewportUseCase } from './application/MapViewportUseCase';
import { ViewportBoundsService } from './domain/ViewportBoundsService';
import { ViewportTransformService } from './domain/ViewportTransformService';
import { ViewportDimensionsService } from './domain/ViewportDimensionsService';
import type { ViewportBounds } from '@/utils/viewportCalculations';

interface MapViewportProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  mapWrapperRef: React.RefObject<HTMLDivElement | null>;
  globalPathLength: number;
}

export const MapViewport: React.FC<MapViewportProps> = ({
  svgRef,
  mapWrapperRef,
  globalPathLength
}) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const dispatch = useDispatch();
  const [svgPath, setSvgPath] = useState<SVGPathElement | null>(null);
  const { svgSize, mapScale, mapPaddingRatio } = useResponsivePath();

  // Zoom dynamique : dézoome pendant le scroll, revient au zoom normal après l'arrêt
  // Configuration dans config/index.ts (DYNAMIC_ZOOM_CONFIG)
  const dynamicScale = useDynamicZoom({
    baseScale: mapScale,
  });

  // Créer les services de domaine et le use case (mémoïsés)Ò
  const useCaseRef = useRef<MapViewportUseCase | null>(null);
  if (!useCaseRef.current) {
    const boundsService = new ViewportBoundsService();
    const transformService = new ViewportTransformService();
    const dimensionsService = new ViewportDimensionsService();
    useCaseRef.current = new MapViewportUseCase(boundsService, transformService, dimensionsService);
  }

  // Config mémoïsée pour le use case (utilise le scale dynamique)
  const viewportConfig = useMemo(
    () => ({
      svgSize,
      scale: dynamicScale, // Utiliser le scale dynamique au lieu de mapScale
      paddingRatio: mapPaddingRatio,
    }),
    [svgSize, dynamicScale, mapPaddingRatio]
  );

  // Mettre à jour la longueur du path dans le store
  useEffect(() => {
    if (svgPath) {
      const newPathLength = svgPath.getTotalLength();
      dispatch(setPathLength(newPathLength));
    }
  }, [svgPath, dispatch]);

  const {
    nextComponent,
    getCurrentPointPosition,
    getCurrentPointAngle,
    getArrowPosition
  } = usePathCalculations(svgPath);

  // Calculer le padding (mémoïsé)
  const { paddingX, paddingY } = useMemo(
    () => useCaseRef.current!.calculatePadding(viewportConfig),
    [viewportConfig]
  );

  // State pour les dimensions de la fenêtre (pour forcer le recalcul des bounds au resize)
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    return useCaseRef.current!.getViewportDimensions();
  });

  // Mémoïser les bounds du viewport - recalculées lors du resize ou changement de config
  // Utiliser un ref pour garder les dernières bounds valides et éviter les recalculs pendant le scroll
  const viewportBoundsRef = useRef<ViewportBounds | null>(null);
  const viewportBounds = useMemo(() => {
    if (!useCaseRef.current!.isValidDimensions(windowSize)) {
      // Si dimensions invalides, retourner les dernières bounds valides pour éviter les problèmes
      return viewportBoundsRef.current;
    }
    const newBounds = useCaseRef.current!.calculateBounds(
      windowSize.width,
      windowSize.height,
      viewportConfig
    );
    // Mettre à jour le ref avec les nouvelles bounds valides
    if (newBounds) {
      viewportBoundsRef.current = newBounds;
    }
    return newBounds ?? viewportBoundsRef.current;
  }, [viewportConfig, windowSize]);


  // Fonction pour mettre à jour la vue avec GSAP (optimisé GPU)
  const updateViewport = useCallback(() => {
    if (!svgRef.current || !svgPath || !mapWrapperRef.current || !viewportBounds) return;
    if (typeof window === 'undefined') return;

    const pointPosition = getCurrentPointPosition();
    const viewportDims = useCaseRef.current!.isValidDimensions(windowSize)
      ? windowSize
      : useCaseRef.current!.getViewportDimensions();

    const transform = useCaseRef.current!.calculateTransform(
      pointPosition,
      viewportDims.width,
      viewportDims.height,
      viewportConfig,
      viewportBounds
    );

    if (!transform) return;

    // Utiliser gsap.set avec les propriétés transform natives pour optimiser GPU
    // GSAP gère automatiquement will-change et l'accélération GPU
    gsap.set(mapWrapperRef.current, {
      x: transform.translateX,
      y: transform.translateY,
      scale: transform.scale,
      transformOrigin: 'top left',
    });
  }, [svgRef, svgPath, mapWrapperRef, getCurrentPointPosition, viewportConfig, viewportBounds, windowSize]);

  // Gérer le positionnement de la vue
  useLayoutEffect(() => {
    updateViewport();
  }, [updateViewport, progress]);

  // Gérer le resize de la fenêtre et les changements de visualViewport (iOS Safari)
  // avec RAF pour optimiser les performances
  // IMPORTANT: Ignorer les changements de visualViewport pendant le scroll pour éviter les bugs
  const isScrolling = useSelector((state: RootState) => state.scroll.isScrolling);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId: number | null = null;
    let resizeTimeout: NodeJS.Timeout | null = null;

    const updateDimensions = () => {
      // Mettre à jour la taille du viewport (utilise visualViewport si disponible)
      // Cela évite les layout shifts quand la barre Safari apparaît/disparaît
      setWindowSize(useCaseRef.current!.getViewportDimensions());

      // Annuler les mises à jour en attente
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }

      // Debounce avec timeout + RAF pour regrouper les mises à jour
      resizeTimeout = setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          updateViewport();
          rafId = null;
        });
      }, 150); // 150ms debounce pour éviter trop de calculs
    };

    const handleResize = () => {
      updateDimensions();
    };

    const handleVisualViewportChange = () => {
      // Se déclenche quand la barre Safari apparaît/disparaît sur iOS
      // IGNORER pendant le scroll pour éviter les bugs où le path disparaît
      if (isScrolling) {
        // Ne pas mettre à jour pendant le scroll - cela évite les recalculs qui causent le bug
        return;
      }
      updateDimensions();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Écouter les changements de visualViewport (iOS Safari)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange, { passive: true });
      window.visualViewport.addEventListener('scroll', handleVisualViewportChange, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportChange);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [updateViewport, isScrolling]);

  const handleGoToNext = useCallback(() => {
    if (!nextComponent) return;
    if (typeof window === 'undefined') return;

    // Utiliser requestAnimationFrame pour s'assurer que les dimensions sont stables
    // Cela évite les problèmes sur iOS où window.innerHeight peut changer
    requestAnimationFrame(() => {
      // Utiliser getViewportHeight() pour être cohérent avec le reste de l'application
      // Cette fonction utilise window.innerHeight de manière stable
      const viewportHeight = getViewportHeight();
      const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
      const maxScroll = calculateMaxScroll(fakeScrollHeight, viewportHeight);
      const targetScrollY = calculateScrollYFromProgress(nextComponent.position.progress, maxScroll);

      // Utiliser window.scrollTo directement au lieu de GSAP pour éviter les problèmes sur iOS
      // GSAP ScrollToPlugin peut avoir des problèmes avec les animations sur iOS Safari
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    });
  }, [nextComponent, globalPathLength]);

  // Mémoïser les calculs de position/angle/arrow pour éviter les recalculs inutiles
  // Ces valeurs ne sont utilisées que si nextComponent existe, donc on les calcule conditionnellement
  const { pointPosition, pointAngle, arrowPosition } = useMemo(() => {
    if (!nextComponent) {
      return { pointPosition: null, pointAngle: 0, arrowPosition: 'right' as const };
    }
    return {
      pointPosition: getCurrentPointPosition(),
      pointAngle: getCurrentPointAngle(),
      arrowPosition: getArrowPosition(),
    };
  }, [nextComponent, getCurrentPointPosition, getCurrentPointAngle, getArrowPosition]);

  return (
    <div
      ref={mapWrapperRef}
      data-map-wrapper
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: svgSize.width + 2 * paddingX,
        height: svgSize.height + 2 * paddingY,
        minWidth: '100vw',
        minHeight: '100vh',
        willChange: 'transform',
        // NOTE: contain retiré pour éviter le bug Safari iOS où le path disparaît quand progress = 0
        // contain: 'paint layout',
        zIndex: 2,
      }}
    >
      <Dynamic 
        svgPath={svgPath}
        paddingX={paddingX}
        paddingY={paddingY}
      />
      <DynamicPathComponents 
        svgPath={svgPath}
        paddingX={paddingX}
        paddingY={paddingY}
      />
      <DynamicPathTangenteComponents
        svgPath={svgPath}
        paddingX={paddingX}
        paddingY={paddingY}
      />
            <SvgPath
              setSvgPath={setSvgPath}
              svgRef={svgRef}
            >
        <SvgPathDebugger
          svgPath={svgPath}
          paddingX={paddingX}
          paddingY={paddingY}
        />
      </SvgPath>
      {nextComponent && nextComponent.anchorId && pointPosition && (
        <PointTrail 
          x={pointPosition.x + paddingX}
          y={pointPosition.y + paddingY}
          nextComponent={{
            ...nextComponent,
            anchorId: nextComponent.anchorId, // TypeScript sait maintenant que anchorId existe
          }}
          onGoToNext={handleGoToNext}
          angle={pointAngle}
          arrowPosition={arrowPosition}
        />
      )}
    </div>
  );
};
