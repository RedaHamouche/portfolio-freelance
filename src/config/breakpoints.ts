// Source unique de vérité pour les breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Types pour les breakpoints
export type BreakpointKey = keyof typeof BREAKPOINTS;

// Fonction utilitaire pour obtenir une valeur de breakpoint
export const getBreakpoint = (key: BreakpointKey): number => {
  return BREAKPOINTS[key];
};

// Fonction pour vérifier si on est au-dessus d'un breakpoint
export const isAboveBreakpoint = (breakpoint: BreakpointKey): boolean => {
  return typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS[breakpoint];
};

// Fonction pour vérifier si on est en dessous d'un breakpoint
export const isBelowBreakpoint = (breakpoint: BreakpointKey): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS[breakpoint];
}; 