'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { loadGSAP } from '@/utils/gsap/lazyLoadGSAP';
import { desktopConfig, mobileConfig } from '@/config';
import styles from './index.module.scss';

interface LoadingScreenProps {
  onComplete: () => void;
  isDesktop: boolean;
}

const MIN_LOADING_TIME = 5000; // 5 secondes minimum

export default function LoadingScreen({ onComplete, isDesktop }: LoadingScreenProps) {
  // Utiliser la config appropriée selon isDesktop (cohérent serveur/client)
  const config = useMemo(() => {
    return isDesktop ? desktopConfig : mobileConfig;
  }, [isDesktop]);

  const pathD = config.PATH_D;
  const svgSize = config.SVG_SIZE;
  const mapPaddingRatio = config.MAP_PADDING_RATIO;

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [canSkip, setCanSkip] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationCompleteRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !pathRef.current) return;

    const initAnimation = async () => {
      const gsap = await loadGSAP();
      startTimeRef.current = performance.now();

      const pathLength = pathRef.current!.getTotalLength();
      const paddingX = svgSize.width * mapPaddingRatio;
      const paddingY = svgSize.height * mapPaddingRatio;

      // Calculer la taille du SVG miniaturisé (environ 60% de la largeur de l'écran)
      const maxWidth = typeof window !== 'undefined' ? window.innerWidth * 0.6 : 800;
      const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600;
      const scale = Math.min(
        maxWidth / (svgSize.width + 2 * paddingX),
        maxHeight / (svgSize.height + 2 * paddingY)
      );

      const scaledWidth = (svgSize.width + 2 * paddingX) * scale;
      const scaledHeight = (svgSize.height + 2 * paddingY) * scale;

      // Centrer le SVG
      if (svgRef.current) {
        svgRef.current.setAttribute('width', scaledWidth.toString());
        svgRef.current.setAttribute('height', scaledHeight.toString());
      }

      // Animation du path qui se dessine progressivement
      gsap.set(pathRef.current, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      });

      // Timeline principale pour toutes les animations
      const masterTimeline = gsap.timeline();

      // Animation du path qui se dessine - lent au début puis accélère
      const pathAnimation = masterTimeline.to(pathRef.current, {
        strokeDashoffset: 0,
        duration: 3,
        ease: 'power3.in', // Commence très lentement puis accélère progressivement
      }, 0);

      // Animations de texte avec effets wow
      if (titleRef.current) {
        gsap.set(titleRef.current, { 
          opacity: 0, 
          y: 50,
          scale: 0.8,
          rotationX: -90
        });
        
        masterTimeline.to(titleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 1,
          ease: 'back.out(1.7)',
        }, 0.5);
        
        // Animation continue de flottement
        gsap.to(titleRef.current, {
          y: -15,
          duration: 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      }

      if (subtitleRef.current) {
        gsap.set(subtitleRef.current, { 
          opacity: 0, 
          y: 30,
          scale: 0.9
        });
        
        masterTimeline.to(subtitleRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
        }, 1);
        
        // Animation continue de flottement (décalée)
        gsap.to(subtitleRef.current, {
          y: -10,
          duration: 2.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 0.3,
        });
      }

      // Animation du SVG container avec rotation subtile
      if (svgRef.current) {
        gsap.set(svgRef.current, { 
          opacity: 0,
          scale: 0.9,
          rotation: -5
        });
        
        masterTimeline.to(svgRef.current, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.5)',
        }, 0.3);
      }

      // Attendre que l'animation soit terminée + 5 secondes minimum
      Promise.all([
        new Promise((resolve) => {
          pathAnimation.eventCallback('onComplete', resolve);
        }),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_TIME)),
      ]).then(() => {
        animationCompleteRef.current = true;
        setCanSkip(true);

        // Fade out du loading screen
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            onComplete();
          },
        });
      });
    };

    initAnimation();
  }, [pathD, svgSize, mapPaddingRatio, onComplete]);

  const handleSkip = async () => {
    if (!canSkip || !containerRef.current) return;

    const gsapInstance = await loadGSAP();
    gsapInstance.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        onComplete();
      },
    });
  };

  const paddingX = svgSize.width * mapPaddingRatio;
  const paddingY = svgSize.height * mapPaddingRatio;
  const viewBox = `0 0 ${svgSize.width + 2 * paddingX} ${svgSize.height + 2 * paddingY}`;

  return (
    <div ref={containerRef} className={styles.loadingScreen}>
      <div className={styles.content}>
        {/* Titre animé */}
        <div ref={titleRef} className={styles.title}>
          Portfolio
        </div>

        {/* SVG Path miniaturisé */}
        <div className={styles.svgContainer}>
          <svg
            ref={svgRef}
            className={styles.svg}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${paddingX}, ${paddingY})`}>
              <path
                ref={pathRef}
                d={pathD}
                fill="none"
                stroke="#000000"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.path}
              />
            </g>
          </svg>
        </div>

        {/* Sous-titre animé */}
        <div ref={subtitleRef} className={styles.subtitle}>
          Explorez mon parcours
        </div>

        {/* Bouton skip (apparaît après 5 secondes) */}
        {canSkip && (
          <button 
            onClick={handleSkip} 
            className={styles.skipButton}
            onMouseEnter={async (e) => {
              const gsap = await loadGSAP();
              gsap.to(e.currentTarget, {
                scale: 1.05,
                duration: 0.2,
                ease: 'power2.out',
              });
            }}
            onMouseLeave={async (e) => {
              const gsap = await loadGSAP();
              gsap.to(e.currentTarget, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.in',
              });
            }}
          >
            <span className={styles.buttonText}>Continuer</span>
            <span className={styles.buttonArrow}>→</span>
          </button>
        )}

        {/* Indicateur de chargement */}
        <div className={styles.loadingIndicator}>
          <div className={styles.loadingBar} />
        </div>
      </div>
    </div>
  );
}

