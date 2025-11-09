import type { ViewportTransform, ViewportBounds } from '@/utils/viewportCalculations';
import type { PointPosition } from '@/utils/pathCalculations/types';
import type { MapViewportConfig } from '../../application/MapViewportUseCase';
import { loadGSAP } from '@/utils/gsap/lazyLoadGSAP';

export interface UpdateViewportParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  svgPath: SVGPathElement | null;
  mapWrapperRef: React.RefObject<HTMLDivElement | null>;
  viewportBounds: ViewportBounds | null;
  getCurrentPointPosition: () => PointPosition | null;
  windowSize: { width: number; height: number };
  calculateTransform: (
    point: PointPosition | null,
    windowWidth: number,
    windowHeight: number,
    config: MapViewportConfig,
    viewportBounds?: ViewportBounds | null
  ) => ViewportTransform | null;
  viewportConfig: MapViewportConfig;
  isValidDimensions: (dimensions: { width: number; height: number }) => boolean;
  getViewportDimensions: () => { width: number; height: number };
}

/**
 * Action pour mettre à jour la vue du viewport avec GSAP (optimisé GPU)
 * Fonction pure, testable individuellement
 * GSAP est lazy loadé pour réduire le bundle initial
 */
export async function updateViewport(params: UpdateViewportParams): Promise<void> {
  const {
    svgRef,
    svgPath,
    mapWrapperRef,
    viewportBounds,
    getCurrentPointPosition,
    windowSize,
    calculateTransform,
    viewportConfig,
    isValidDimensions,
    getViewportDimensions,
  } = params;

  if (!svgRef.current || !svgPath || !mapWrapperRef.current || !viewportBounds) return;
  if (typeof window === 'undefined') return;

  const pointPosition = getCurrentPointPosition();
  const viewportDims = isValidDimensions(windowSize)
    ? windowSize
    : getViewportDimensions();

  const transform = calculateTransform(
    pointPosition,
    viewportDims.width,
    viewportDims.height,
    viewportConfig,
    viewportBounds
  );

  if (!transform) return;

  // Lazy load GSAP
  const gsap = await loadGSAP();

  // Utiliser gsap.set avec les propriétés transform natives pour optimiser GPU
  // GSAP gère automatiquement will-change et l'accélération GPU
  // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
  gsap.set(mapWrapperRef.current, {
    x: transform.translateX,
    y: transform.translateY,
    scaleX: transform.scale,
    scaleY: transform.scale,
    transformOrigin: 'top left',
  });
}

