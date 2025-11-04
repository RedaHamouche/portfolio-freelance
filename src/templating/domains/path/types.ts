/**
 * Types du domaine Path
 * Composants positionnés à un point précis du path (progress-based)
 */

export interface PathComponentPosition {
  progress: number;
}

export interface PathComponent {
  id: string;
  type: string;
  displayName: string;
  anchorId?: string;
  position: PathComponentPosition;
  autoScrollPauseTime?: number;
  [key: string]: unknown; // Pour permettre des props supplémentaires selon le type
}

export type PathComponentsConfig = PathComponent[];

