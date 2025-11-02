import { MAP_SCALE, MAP_PADDING_RATIO } from '@/config';
import type { PointPosition } from './pathCalculations';

// Note: svgSize est passé en paramètre aux fonctions pour supporter le responsive (mobile/desktop)

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
export const calculateMapPadding = (svgSize: { width: number; height: number }): { paddingX: number; paddingY: number } => {
  return {
    paddingX: svgSize.width * MAP_PADDING_RATIO,
    paddingY: svgSize.height * MAP_PADDING_RATIO,
  };
};

/**
 * Calcule les dimensions avec padding
 */
export const calculatePaddedDimensions = (svgSize: { width: number; height: number }): { paddedWidth: number; paddedHeight: number } => {
  const { paddingX, paddingY } = calculateMapPadding(svgSize);
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
  scale: number = MAP_SCALE
): ViewportBounds => {
  const { paddedWidth, paddedHeight } = calculatePaddedDimensions(svgSize);
  
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
 */
export const calculateViewportTransform = (
  point: PointPosition,
  windowWidth: number,
  windowHeight: number,
  svgSize: { width: number; height: number },
  scale: number = MAP_SCALE
): ViewportTransform => {
  const { paddingX, paddingY } = calculateMapPadding(svgSize);
  const bounds = calculateViewportBounds(windowWidth, windowHeight, svgSize, scale);
  
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

