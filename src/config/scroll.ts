// Configuration du scroll
export const SCROLL_CONFIG = {
  // Multiplicateur pour convertir la longueur du path en pixels de scroll
  SCROLL_PER_PX: 1.5,
  
  // Tolérance pour la détection des anchors (en progress)
  ANCHOR_TOLERANCE: 0.002,
  
  // Délai pour détecter la fin du scroll manuel (ms)
  SCROLL_END_DELAY: 150,
  
  // Délai approximatif entre les frames d'animation (ms)
  FRAME_DELAY: 16,
  
  // Bump pour sortir de la zone d'un anchor après pause (en progress)
  ANCHOR_BUMP: 0.002,
  
  // Marges pour le scroll infini
  SCROLL_MARGINS: {
    TOP: 2,
    BOTTOM: 1
  }
} as const;

// Types pour les constantes
export type ScrollDirection = 'haut' | 'bas' | null;
export type AutoScrollDirection = 1 | -1; 