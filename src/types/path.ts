/**
 * Types pour les composants du path
 */

export interface PathComponentPosition {
  progress: number;
  start?: number;
  end?: number;
}

export interface PathComponentData {
  id: string;
  type: string;
  displayName: string;
  anchorId: string;
  position: PathComponentPosition;
  autoScrollPauseTime?: number;
  [key: string]: unknown; // Pour les props spécifiques à chaque type de composant
}

export interface PointPosition {
  x: number;
  y: number;
}

