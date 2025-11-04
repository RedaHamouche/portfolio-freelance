/**
 * Types du domaine Page
 * Composants positionnés avec top/left (position absolue)
 */

export type LegacyPosition = {
  top?: number;
  left?: number;
};

export type ResponsivePosition = {
  desktop?: { top?: number; left?: number };
  mobile?: { top?: number; left?: number };
};

export type ComponentPosition = LegacyPosition | ResponsivePosition;

export interface PageComponent {
  type: string;
  displayName: string;
  position: ComponentPosition;
  [key: string]: unknown; // Pour permettre des props supplémentaires selon le type
}

export interface PageConfig {
  components: PageComponent[];
}

