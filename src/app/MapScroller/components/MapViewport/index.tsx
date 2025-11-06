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
import gsap from 'gsap';
import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { MapViewportUseCase } from './application/MapViewportUseCase';
import { ViewportBoundsService } from './domain/ViewportBoundsService';
import { ViewportTransformService } from './domain/ViewportTransformService';
import { ViewportDimensionsService } from './domain/ViewportDimensionsService';

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

  // Créer les services de domaine et le use case (mémoïsés)
  const useCaseRef = useRef<MapViewportUseCase | null>(null);
  if (!useCaseRef.current) {
    const boundsService = new ViewportBoundsService();
    const transformService = new ViewportTransformService();
    const dimensionsService = new ViewportDimensionsService();
    useCaseRef.current = new MapViewportUseCase(boundsService, transformService, dimensionsService);
  }

  // Config mémoïsée pour le use case
  const viewportConfig = useMemo(
    () => ({
      svgSize,
      scale: mapScale,
      paddingRatio: mapPaddingRatio,
    }),
    [svgSize, mapScale, mapPaddingRatio]
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
  const viewportBounds = useMemo(() => {
    if (!useCaseRef.current!.isValidDimensions(windowSize)) return null;
    return useCaseRef.current!.calculateBounds(
      windowSize.width,
      windowSize.height,
      viewportConfig
    );
  }, [viewportConfig, windowSize]);

  // State pour stocker le transform du viewport (pour le clipPath du SVG)
  const [viewportTransform, setViewportTransform] = useState<{ translateX: number; translateY: number; scale: number } | null>(null);

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

    // Stocker le transform pour le clipPath du SVG
    setViewportTransform({
      translateX: transform.translateX,
      translateY: transform.translateY,
      scale: transform.scale,
    });

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
  }, [updateViewport]);

  const handleGoToNext = useCallback(() => {
    if (!nextComponent) return;

    const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
    const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
    const targetScrollY = calculateScrollYFromProgress(nextComponent.position.progress, maxScroll);

    gsap.to(window, {
      scrollTo: {
        y: targetScrollY,
        autoKill: true
      },
      duration: 0.8,
      ease: 'power2.out'
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
        contain: 'paint layout',
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
        viewportTransform={viewportTransform}
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
