import { useState, useEffect } from 'react';
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
 */
export function useResponsivePath(): PathConfig {
  const [pathConfig, setPathConfig] = useState<PathConfig>(() => {
    const config = getConfig();
    return {
      pathD: config.PATH_D,
      svgSize: config.SVG_SIZE,
      mapScale: config.MAP_SCALE,
      mapPaddingRatio: config.MAP_PADDING_RATIO,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const config = getConfig();
      setPathConfig({
        pathD: config.PATH_D,
        svgSize: config.SVG_SIZE,
        mapScale: config.MAP_SCALE,
        mapPaddingRatio: config.MAP_PADDING_RATIO,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return pathConfig;
}

