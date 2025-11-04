/**
 * Types du domaine Page
 * Composants positionnés avec top/left (position absolue)
 */

export type ComponentPosition = {
  top?: number;
  left?: number;
};

export interface PageComponent {
  type: string;
  displayName: string;
  position: ComponentPosition;
  [key: string]: unknown; // Pour permettre des props supplémentaires selon le type
}

export interface PageConfig {
  components: PageComponent[];
}

