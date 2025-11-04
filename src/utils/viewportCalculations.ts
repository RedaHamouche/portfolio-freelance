import type { PointPosition } from './pathCalculations';

// Note: svgSize, scale et paddingRatio sont passés en paramètre aux fonctions pour supporter le responsive (mobile/desktop)

export interface ViewportTransform {
  translateX: number;
  translateY: number;
  scale: number;
}

export interface ViewportBounds {
  width: number;
  height: number;
  paddedWidth: number;
  paddedHeight: number;
  maxX: number;
  maxY: number;
}

/**
 * Calcule le padding de la carte
 */
export const calculateMapPadding = (
  svgSize: { width: number; height: number },
  paddingRatio: number
): { paddingX: number; paddingY: number } => {
  return {
    paddingX: svgSize.width * paddingRatio,
    paddingY: svgSize.height * paddingRatio,
  };
};

/**
 * Calcule les dimensions avec padding
 */
export const calculatePaddedDimensions = (
  svgSize: { width: number; height: number },
  paddingRatio: number
): { paddedWidth: number; paddedHeight: number } => {
  const { paddingX, paddingY } = calculateMapPadding(svgSize, paddingRatio);
  return {
    paddedWidth: svgSize.width + 2 * paddingX,
    paddedHeight: svgSize.height + 2 * paddingY,
  };
};

/**
 * Calcule les limites du viewport
 */
export const calculateViewportBounds = (
  windowWidth: number,
  windowHeight: number,
  svgSize: { width: number; height: number },
  scale: number,
  paddingRatio: number
): ViewportBounds => {
  const { paddedWidth, paddedHeight } = calculatePaddedDimensions(svgSize, paddingRatio);
  
  return {
    width: svgSize.width,
    height: svgSize.height,
    paddedWidth,
    paddedHeight,
    maxX: Math.max(0, paddedWidth * scale - windowWidth),
    maxY: Math.max(0, paddedHeight * scale - windowHeight),
  };
};

/**
 * Calcule la transformation du viewport pour centrer un point
 * @param viewportBounds Bounds pré-calculées (optionnel, calculées si non fourni)
 */
export const calculateViewportTransform = (
  point: PointPosition,
  windowWidth: number,
  windowHeight: number,
  svgSize: { width: number; height: number },
  scale: number,
  paddingRatio: number,
  viewportBounds?: ViewportBounds | null
): ViewportTransform => {
  const { paddingX, paddingY } = calculateMapPadding(svgSize, paddingRatio);
  // Utiliser les bounds pré-calculées si fournies, sinon les calculer
  const bounds = viewportBounds ?? calculateViewportBounds(windowWidth, windowHeight, svgSize, scale, paddingRatio);
  
  const idealX = (point.x + paddingX) * scale - windowWidth / 2;
  const idealY = (point.y + paddingY) * scale - windowHeight / 2;
  
  const clampedX = Math.max(0, Math.min(idealX, bounds.maxX));
  const clampedY = Math.max(0, Math.min(idealY, bounds.maxY));
  
  return {
    translateX: -clampedX,
    translateY: -clampedY,
    scale,
  };
};

/**
 * Applique la transformation au wrapper du viewport
 */
export const applyViewportTransform = (
  element: HTMLElement,
  transform: ViewportTransform
): void => {
  element.style.transform = `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`;
  element.style.transformOrigin = 'top left';
};

