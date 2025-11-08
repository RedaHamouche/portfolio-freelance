import { useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import gsap from 'gsap';
import Image from '@/app/Image';
import styles from './index.module.scss';

export type PieceOfArtType = {
  src?: string;
  mobileSrc?: string;
  desktopSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  displayName?: string;
  position?: {
    progress?: number;
  };
}

export default function PieceOfArt({
  src,
  mobileSrc,
  desktopSrc,
  alt = 'Piece of Art',
  width = 300,
  height = 300,
  displayName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  position, // Non utilisé pour l'instant, mais gardé pour compatibilité
}: PieceOfArtType) {
  const animatedRef = useRef<HTMLDivElement>(null);
  const progress = useSelector((state: RootState) => state.scroll.progress);
  
  // Utiliser les sources du JSON, ou fallback vers des images Unsplash par défaut
  const defaultDesktopSrc = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop&q=80';
  const defaultMobileSrc = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop&q=80';
  const defaultSrc = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=450&fit=crop&q=80';

  // OPTIMISATION: Utiliser gsap.quickTo pour de meilleures performances
  const quickSettersRef = useRef<{
    xPercent?: (value: number) => void;
    yPercent?: (value: number) => void;
    scaleX?: (value: number) => void;
    scaleY?: (value: number) => void;
    rotation?: (value: number) => void;
  }>({});
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!animatedRef.current || isInitializedRef.current) return;
    
    // Initialiser la position de départ avec GSAP (centré)
    // Initialiser avec scaleX et scaleY pour éviter l'erreur "scale not eligible for reset"
    gsap.set(animatedRef.current, {
      xPercent: -50,
      yPercent: -50,
      scaleX: 1,
      scaleY: 1,
    });
    
    // OPTIMISATION: Créer les quickSetters une seule fois pour de meilleures performances
    quickSettersRef.current = {
      xPercent: gsap.quickTo(animatedRef.current, 'xPercent', { duration: 0.4, ease: 'power2.out' }),
      yPercent: gsap.quickTo(animatedRef.current, 'yPercent', { duration: 0.4, ease: 'power2.out' }),
      scaleX: gsap.quickTo(animatedRef.current, 'scaleX', { duration: 0.4, ease: 'power2.out' }),
      scaleY: gsap.quickTo(animatedRef.current, 'scaleY', { duration: 0.4, ease: 'power2.out' }),
      rotation: gsap.quickTo(animatedRef.current, 'rotation', { duration: 0.4, ease: 'power2.out' }),
    };
    
    isInitializedRef.current = true;
  }, []);

  // Calculer tous les effets d'animation basés sur le progress (cyclique et fluide)
  const animationValues = useMemo(() => {
    // Taille du cycle (se répète tous les 0.1 de progress)
    const cycleSize = 0.1;
    
    // Calculer la position dans le cycle en utilisant modulo
    // Cela crée un effet qui boucle continuellement
    const cyclePosition = (progress % cycleSize) / cycleSize; // 0 à 1 dans chaque cycle
    
    // Créer une onde sinusoïdale pour un effet fluide et cyclique
    // Utiliser sin pour créer un effet qui monte et descend en douceur
    const wave = Math.sin(cyclePosition * Math.PI * 2); // -1 à 1, cycle complet
    
    // Normaliser la vague sur [0, 1] pour les effets
    const normalizedWave = (wave + 1) / 2; // 0 à 1
    
    // Effet 1: Scale (magnétisme/pulse) - pulse entre 0.95 et 1.05
    const scale = 0.95 + normalizedWave * 0.1;
    
    // Effet 2: Rotation cyclique - rotation fluide de -2° à +2°
    const rotation = wave * 2; // -2 à +2 degrés
    
    // Pas de parallaxe (translateX/Y) pour éviter les sauts brusques
    
    return {
      scale,
      translateX: 0,
      translateY: 0,
      rotation,
    };
  }, [progress]);

  // OPTIMISATION: Appliquer les effets avec gsap.quickTo (plus performant que gsap.to)
  useEffect(() => {
    if (!animatedRef.current || !isInitializedRef.current) return;
    if (!quickSettersRef.current.xPercent) return; // Attendre l'initialisation
    
    // Utiliser quickSetters pour de meilleures performances (pas de création/destruction d'animations)
    const { xPercent, yPercent, scaleX, scaleY, rotation } = quickSettersRef.current;
    if (xPercent) xPercent(-50 + animationValues.translateX);
    if (yPercent) yPercent(-50 + animationValues.translateY);
    if (scaleX) scaleX(animationValues.scale);
    if (scaleY) scaleY(animationValues.scale);
    if (rotation) rotation(animationValues.rotation);
  }, [animationValues]);

  return (
    <div className={styles.main}>
      {displayName && <h3 className={styles.title}>{displayName}</h3>}
      <div className={styles.imageWrapper} style={{ width: `${width}px`, height: `${height}px` }}>
        <div className={styles.imageContainer}>
          <div ref={animatedRef} className={styles.imageAnimated}>
            <Image
              src={src || defaultSrc}
              mobileSrc={mobileSrc || defaultMobileSrc}
              desktopSrc={desktopSrc || defaultDesktopSrc}
              alt={alt}
              width={width}
              height={height}
              className={styles.image}
              fill={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}