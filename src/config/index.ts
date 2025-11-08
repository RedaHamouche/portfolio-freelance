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
  // Doit être supérieur à ANCHOR_TOLERANCE pour éviter la double détection
  ANCHOR_BUMP: 0.004,
  
  // Marges pour le scroll infini
  SCROLL_MARGINS: {
    TOP: 20,
    BOTTOM: 20
  }
} as const;

export type ScrollDirection = 'haut' | 'bas' | null;
export type AutoScrollDirection = 1 | -1;

// Scroll Inertia & Easing Configuration
// ============================================
// INERTIE : Force du mouvement continu après l'arrêt du scroll
// ============================================
// Plus petit = plus d'inertie (plus lent), plus grand = moins d'inertie (plus rapide)
// Valeurs recommandées : 0.01 (très forte) à 0.30 (très faible)
// 1.0 = pas d'inertie (synchronisation directe)
export const SCROLL_INERTIA_FACTOR = 1.0; // Désactivé : synchronisation directe

// ============================================
// EASING : Courbe d'animation (comment l'animation décélère)
// ============================================
// Options : 'linear', 'easeOut', 'easeInOut', 'easeOutQuad', 'easeOutCubic'
// - 'linear' : Pas de courbe (décélération constante)
// - 'easeOut' : Décélération douce (recommandé)
// - 'easeInOut' : Accélération puis décélération
// - 'easeOutQuad' : Décélération plus douce
// - 'easeOutCubic' : Décélération très douce
export const SCROLL_EASING_TYPE: 'linear' 
| 'easeOut' 
| 'easeInOut' 
| 'easeOutQuad' 
| 'easeOutCubic' = 'easeOut'; // ← MODIFIEZ POUR CHANGER LA COURBE

// Seuil minimum pour arrêter l'animation (delta minimum)
export const SCROLL_EASING_MIN_DELTA = 0.0001;

// ============================================
// VELOCITY-BASED INERTIA : Inertie basée sur la vélocité (friction naturelle)
// ============================================
// Simule une "masse" naturelle : plus tu scrolles fort, plus le PointTrail a de traînée
// Configuration pour mobile et desktop
export const SCROLL_VELOCITY_CONFIG = {
  // Désactiver l'inertie basée sur la vélocité (friction/masse)
  enabled: false,
  
  // Configuration mobile
  mobile: {
    friction: 0.92, // Coefficient de friction (0.92 = décroissance de 8% par frame)
    maxVelocity: 0.1, // Vélocité maximale (pour éviter les valeurs extrêmes)
    velocityToInertiaMultiplier: 0.5, // Multiplicateur pour convertir la vélocité en inertiaFactor
    baseInertiaFactor: 0.06, // Facteur d'inertie de base (quand vélocité = 0)
  },
  
  // Configuration desktop
  desktop: {
    friction: 0.94, // Friction légèrement plus faible sur desktop (plus d'inertie)
    maxVelocity: 0.12,
    velocityToInertiaMultiplier: 0.6,
    baseInertiaFactor: 0.06,
  },
} as const;

// Auto Scroll Configuration
// ============================================
// Configuration de la vitesse d'autoscroll pour mobile et desktop
// ============================================
export const AUTO_SCROLL_CONFIG = {
  // Vitesse par défaut (utilisée si non spécifiée dans mobile/desktop)
  default: {
    speed: 0.8, // Vitesse par défaut
  },
  // Configuration mobile
  mobile: {
    speed: 0.6, // Vitesse sur mobile (modifiable)
  },
  // Configuration desktop
  desktop: {
    speed: 0.8, // Vitesse sur desktop (modifiable)
  },
  // Configuration de l'easing (ralentissement à l'approche, accélération après)
  easing: {
    enabled: true, // Activer/désactiver l'easing
    approachDistance: 0.05, // Distance à partir de laquelle on commence à ralentir (5% du path)
    minSpeed: 0.3, // Vitesse minimale à l'approche (30% de la vitesse normale)
    accelerationDistance: 0.03, // Distance après le composant pour accélérer (3% du path)
    maxSpeed: 1.5, // Vitesse maximale après le composant (150% de la vitesse normale)
  },
} as const;

// Rétrocompatibilité : export de la vitesse par défaut
export const AUTO_SCROLL_SPEED = AUTO_SCROLL_CONFIG.default.speed;

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
    enabled: false, // Activer le zoom dynamique
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
