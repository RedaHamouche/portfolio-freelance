'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import classnames from 'classnames';
import { imageConfig } from '@/config/image';
import styles from './index.module.scss';

interface ImageProps {
  src: string;
  alt: string;
  mobileSrc?: string;
  desktopSrc?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Image({
  src,
  alt,
  mobileSrc,
  desktopSrc,
  width,
  height,
  className,
  priority = false,
  quality = imageConfig.quality.default,
  placeholder = 'empty',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, 50vw',
  fill = false,
  style,
  onClick,
}: ImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Détecter la taille d'écran et choisir la bonne image
  useEffect(() => {
    const updateImageSrc = () => {
      const isMobile = window.innerWidth <= imageConfig.responsive.mobileBreakpoint;
      if (isMobile && mobileSrc) {
        setImageSrc(mobileSrc);
      } else if (!isMobile && desktopSrc) {
        setImageSrc(desktopSrc);
      } else {
        setImageSrc(src);
      }
    };

    updateImageSrc();
    window.addEventListener('resize', updateImageSrc);
    return () => window.removeEventListener('resize', updateImageSrc);
  }, [src, mobileSrc, desktopSrc]);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: imageConfig.lazyLoading.rootMargin,
        threshold: imageConfig.lazyLoading.threshold,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error(`Failed to load image: ${imageSrc}`);
    // Fallback vers l'image principale si l'image responsive échoue
    if (imageSrc !== src) {
      setImageSrc(src);
    }
  };

  return (
    <div
      ref={containerRef}
      className={classnames(styles.imageContainer, className)}
      style={style}
      onClick={onClick}
    >
      {isInView && (
        <NextImage
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          sizes={sizes}
          className={classnames(styles.image, {
            [styles.loaded]: isLoaded,
            [styles.clickable]: !!onClick,
          })}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* Placeholder pendant le chargement */}
      {!isLoaded && isInView && (
        <div className={styles.placeholder}>
          <div className={styles.skeleton} />
        </div>
      )}
    </div>
  );
} 