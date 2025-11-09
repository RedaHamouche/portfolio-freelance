import type { ViewportTransform } from '@/utils/viewportCalculations';
import type { PointPosition } from '@/types/path';
import gsap from 'gsap';

export interface UpdateViewportParams {
  svgRef: React.RefObject<SVGSVGElement | null>;
  svgPath: SVGPathElement | null;
  mapWrapperRef: React.RefObject<HTMLDivElement | null>;
  viewportBounds: any;
  getCurrentPointPosition: () => PointPosition | null;
  windowSize: { width: number; height: number };
  calculateTransform: (
    point: PointPosition | null,
    windowWidth: number,
    windowHeight: number,
    config: any,
    viewportBounds?: any
  ) => ViewportTransform | null;
  viewportConfig: any;
  isValidDimensions: (dimensions: { width: number; height: number }) => boolean;
  getViewportDimensions: () => { width: number; height: number };
}

/**
 * Action pour mettre à jour la vue du viewport avec GSAP (optimisé GPU)
 * Fonction pure, testable individuellement
 */
export function updateViewport(params: UpdateViewportParams): void {
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

