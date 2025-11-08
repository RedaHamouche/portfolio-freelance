import { useMemo } from 'react';
import { getConfig } from '@/config';

export interface PathConfig {
  pathD: string;
  svgSize: { width: number; height: number };
  mapScale: number;
  mapPaddingRatio: number;
}

/**
 * Hook pour obtenir la configuration responsive (path, taille SVG, scale, etc.)
 * Mobile: 0-1023px
 * Desktop: 1024px+
 * 
 * OPTIMISATION: Déterminé une seule fois au chargement (pas de resize)
 * Personne ne resize son écran dans la vraie vie
 */
export function useResponsivePath(): PathConfig {
  // OPTIMISATION: Déterminer la config une seule fois au chargement
  const pathConfig = useMemo(() => {
    const config = getConfig();
    return {
      pathD: config.PATH_D,
      svgSize: config.SVG_SIZE,
      mapScale: config.MAP_SCALE,
      mapPaddingRatio: config.MAP_PADDING_RATIO,
    };
  }, []);

  return pathConfig;
}

