import { SVG_SIZE } from '@/config/path';
import { MAP_SCALE } from '@/config/mapScale';
import { MAP_PADDING_RATIO } from '@/config/mapPadding';
import type { PointPosition } from './pathCalculations';

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
export const calculateMapPadding = (): { paddingX: number; paddingY: number } => {
  return {
    paddingX: SVG_SIZE.width * MAP_PADDING_RATIO,
    paddingY: SVG_SIZE.height * MAP_PADDING_RATIO,
  };
};

/**
 * Calcule les dimensions avec padding
 */
export const calculatePaddedDimensions = (): { paddedWidth: number; paddedHeight: number } => {
  const { paddingX, paddingY } = calculateMapPadding();
  return {
    paddedWidth: SVG_SIZE.width + 2 * paddingX,
    paddedHeight: SVG_SIZE.height + 2 * paddingY,
  };
};

/**
 * Calcule les limites du viewport
 */
export const calculateViewportBounds = (windowWidth: number, windowHeight: number): ViewportBounds => {
  const { paddedWidth, paddedHeight } = calculatePaddedDimensions();
  
  return {
    width: SVG_SIZE.width,
    height: SVG_SIZE.height,
    paddedWidth,
    paddedHeight,
    maxX: Math.max(0, paddedWidth * MAP_SCALE - windowWidth),
    maxY: Math.max(0, paddedHeight * MAP_SCALE - windowHeight),
  };
};

/**
 * Calcule la transformation du viewport pour centrer un point
 */
export const calculateViewportTransform = (
  point: PointPosition,
  windowWidth: number,
  windowHeight: number
): ViewportTransform => {
  const { paddingX, paddingY } = calculateMapPadding();
  const bounds = calculateViewportBounds(windowWidth, windowHeight);
  
  const idealX = (point.x + paddingX) * MAP_SCALE - windowWidth / 2;
  const idealY = (point.y + paddingY) * MAP_SCALE - windowHeight / 2;
  
  const clampedX = Math.max(0, Math.min(idealX, bounds.maxX));
  const clampedY = Math.max(0, Math.min(idealY, bounds.maxY));
  
  return {
    translateX: -clampedX,
    translateY: -clampedY,
    scale: MAP_SCALE,
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

