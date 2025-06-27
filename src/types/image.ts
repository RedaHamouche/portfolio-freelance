export interface ResponsiveImage {
  src: {
    mobile: string;
    desktop: string;
  };
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
}

export interface SimpleImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
}

// Type union pour supporter les deux formats
export type ImageConfig = ResponsiveImage | SimpleImage; 