import { useState, useEffect } from 'react';

interface SvgSize {
  width: number;
  height: number;
}

interface UsePathLoaderReturn {
  pathD: string | null;
  svgSize: SvgSize;
  isLoading: boolean;
  error: string | null;
}

const PATH_SVG_URL = '/path.svg';

export const usePathLoader = (): UsePathLoaderReturn => {
  const [pathD, setPathD] = useState<string | null>(null);
  const [svgSize, setSvgSize] = useState<SvgSize>({ width: 3000, height: 2000 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPath = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(PATH_SVG_URL);
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.statusText}`);
        }
        
        const svgText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        
        const path = doc.querySelector('path');
        const svg = doc.querySelector('svg');
        
        if (!path || !svg) {
          throw new Error('Invalid SVG structure');
        }
        
        setPathD(path.getAttribute('d'));
        setSvgSize({
          width: Number(svg.getAttribute('width')) || 3000,
          height: Number(svg.getAttribute('height')) || 2000,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error loading SVG path:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPath();
  }, []);

  return { pathD, svgSize, isLoading, error };
}; 