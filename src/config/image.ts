import { BREAKPOINTS } from '@/config/breakpoints';

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