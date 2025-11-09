'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import classnames from 'classnames';
import { imageConfig } from '@/config';
import { useDeviceSafe } from '@/contexts/DeviceContext';
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
  
  // Utiliser isDesktop pré-détecté côté serveur (évite le FOUC)
  // Fallback automatique sur window.innerWidth si le contexte n'est pas disponible
  const { isDesktop } = useDeviceSafe();

  // OPTIMISATION: Déterminer la source de l'image une seule fois au chargement (pas de resize)
  // Utilise isDesktop pré-détecté côté serveur pour éviter le FOUC
  useEffect(() => {
    const isMobile = !isDesktop;
    if (isMobile && mobileSrc) {
      setImageSrc(mobileSrc);
    } else if (!isMobile && desktopSrc) {
      setImageSrc(desktopSrc);
    } else {
      setImageSrc(src);
    }
  }, [src, mobileSrc, desktopSrc, isDesktop]);

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