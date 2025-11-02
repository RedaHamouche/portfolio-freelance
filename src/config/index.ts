// ============================================================================
// CONFIGURATION CENTRALISÉE
// ============================================================================
// Toutes les constantes de configuration de l'application sont centralisées ici
// pour faciliter la maintenance et éviter la dispersion dans plusieurs fichiers.

// ============================================================================
// BREAKPOINTS
// ============================================================================
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const getBreakpoint = (key: BreakpointKey): number => {
  return BREAKPOINTS[key];
};

export const isAboveBreakpoint = (breakpoint: BreakpointKey): boolean => {
  return typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS[breakpoint];
};

export const isBelowBreakpoint = (breakpoint: BreakpointKey): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS[breakpoint];
};

// ============================================================================
// SVG PATH - Desktop & Mobile
// ============================================================================
// Données du path (facilement modifiables depuis Figma)
// Desktop (1024px et au-dessus)
export const PATH_D_DESKTOP = "M2193.5 559L5823.5 2515.5L4755.5 4009L5181 95.5L1541.5 5143.5L85.5 1L0.5 5200.5L2193.5 559Z";
export const SVG_SIZE_DESKTOP = { width: 5825, height: 5201 } as const;

// Mobile (0-1023px) - Par défaut, utilise le même que desktop, à remplacer avec ton path mobile
export const PATH_D_MOBILE = "M2193.5 559L5823.5 2515.5L4755.5 4009L5181 95.5L1541.5 5143.5L85.5 1L0.5 5200.5L2193.5 559Z";
export const SVG_SIZE_MOBILE = { width: 5825, height: 5201 } as const;

// ============================================================================
// MAP CONFIGURATION
// ============================================================================
export const MAP_SCALE = 1;
export const MAP_PADDING_RATIO = 0.02; // 2% de padding autour du SVG

// ============================================================================
// SCROLL CONFIGURATION
// ============================================================================
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

export type ScrollDirection = 'haut' | 'bas' | null;
export type AutoScrollDirection = 1 | -1;

// ============================================================================
// AUTO SCROLL
// ============================================================================
export const AUTO_SCROLL_SPEED = 0.04; // valeur par défaut, modifiable

// ============================================================================
// ANCHOR CONFIGURATION
// ============================================================================
export const ANCHOR_RANGE = 0.01; // 1% autour du progress

// ============================================================================
// IMAGE CONFIGURATION
// ============================================================================
export const imageConfig = {
  lazyLoading: {
    rootMargin: '50px', // Distance avant le viewport pour déclencher le chargement
    threshold: 0.1, // Pourcentage de visibilité requis
  },
  responsive: {
    mobileBreakpoint: BREAKPOINTS.tablet, // Utilise le breakpoint tablet
    tabletBreakpoint: BREAKPOINTS.tablet,
    desktopBreakpoint: BREAKPOINTS.desktop,
  },
  quality: {
    default: 85, // Qualité par défaut des images
  },
} as const;

