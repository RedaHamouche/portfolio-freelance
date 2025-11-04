/**
 * Types du domaine Tangente
 * Composants qui suivent la courbe du path (text on path)
 */

export interface PathTangenteComponentPosition {
  startProgress: number;
  length: number;
  progress?: number; // Alias pour startProgress si length n'est pas défini
}

export interface PathTangenteComponent {
  id: string;
  type: string;
  displayName: string;
  text?: string; // Requis pour TextOnPath
  position: PathTangenteComponentPosition;
  offset?: number; // Distance perpendiculaire au path (défaut: 40)
  [key: string]: unknown; // Pour permettre des props supplémentaires selon le type
}

export type PathTangenteComponentsConfig = PathTangenteComponent[];

