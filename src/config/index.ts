// ============================================================================
// CONFIGURATION CENTRALISÉE
// ============================================================================
// Toutes les constantes de configuration de l'application sont centralisées ici
// pour faciliter la maintenance et éviter la dispersion dans plusieurs fichiers.

// Import des configs responsive
import * as desktopConfig from './desktop';
import * as mobileConfig from './mobile';

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
// CONFIGURATION RESPONSIVE
// ============================================================================
// Fonction pour obtenir la configuration selon le breakpoint
export const getConfig = () => {
  if (typeof window === 'undefined') {
    return desktopConfig; // Par défaut côté serveur
  }
  return window.innerWidth < BREAKPOINTS.desktop ? mobileConfig : desktopConfig;
};

// Export des configs pour utilisation directe si besoin
export { desktopConfig, mobileConfig };

// ============================================================================
// CONFIGURATIONS PARTAGÉES (Communes à desktop et mobile)
// ============================================================================

// Scroll Configuration
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

// Auto Scroll
export const AUTO_SCROLL_SPEED = 0.04; // valeur par défaut, modifiable

// Anchor Configuration
export const ANCHOR_RANGE = 0.01; // 1% autour du progress

// Image Configuration
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
    default: 100, // Qualité par défaut des images
  },
} as const;

// Dynamic Zoom Configuration
export const DYNAMIC_ZOOM_CONFIG = {
  // Configuration par défaut (utilisée si non spécifiée dans mobile/desktop)
  default: {
    enabled: true, // Activer le zoom dynamique
    zoomOutFactor: 0.1, // 10% de dézoom pendant le scroll
    animationDuration: 0.3, // Durée de l'animation en secondes
    ease: 'power2.out' as const, // Easing GSAP
  },
  // Configuration mobile
  mobile: {
    enabled: true, // Activer sur mobile
    zoomOutFactor: 0.1, // 10% de dézoom
    animationDuration: 0.3, // Durée de l'animation
    ease: 'power2.out' as const,
  },
  // Configuration desktop
  desktop: {
    enabled: true, // Activer sur desktop
    zoomOutFactor: 0.1, // 10% de dézoom
    animationDuration: 0.3, // Durée de l'animation
    ease: 'power2.out' as const,
  },
} as const;
