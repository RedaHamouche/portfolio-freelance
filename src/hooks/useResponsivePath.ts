import { useState, useEffect } from 'react';
import { 
  BREAKPOINTS, 
  PATH_D_MOBILE, 
  SVG_SIZE_MOBILE, 
  PATH_D_DESKTOP, 
  SVG_SIZE_DESKTOP 
} from '@/config';

export interface PathConfig {
  pathD: string;
  svgSize: { width: number; height: number };
}

/**
 * Hook pour obtenir le path et la taille SVG selon le breakpoint
 * Mobile: 0-1023px
 * Desktop: 1024px+
 */
export function useResponsivePath(): PathConfig {
  const [pathConfig, setPathConfig] = useState<PathConfig>(() => {
    // Initialisation côté serveur ou si window n'existe pas
    if (typeof window === 'undefined') {
      return {
        pathD: PATH_D_DESKTOP,
        svgSize: SVG_SIZE_DESKTOP,
      };
    }
    
    // Côté client, déterminer selon la largeur
    const isMobile = window.innerWidth < BREAKPOINTS.desktop;
    return {
      pathD: isMobile ? PATH_D_MOBILE : PATH_D_DESKTOP,
      svgSize: isMobile ? SVG_SIZE_MOBILE : SVG_SIZE_DESKTOP,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < BREAKPOINTS.desktop;
      setPathConfig({
        pathD: isMobile ? PATH_D_MOBILE : PATH_D_DESKTOP,
        svgSize: isMobile ? SVG_SIZE_MOBILE : SVG_SIZE_DESKTOP,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return pathConfig;
}

