import { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { loadGSAP } from '@/utils/gsap/lazyLoadGSAP';

interface CursorAnimationRefs {
  cursorElement: HTMLDivElement;
  outerSvg: SVGSVGElement;
  innerSvgContainer: HTMLDivElement;
}

interface CursorAnimationControls {
  moveTo: (x: number, y: number) => void;
  animateClick: (isClicking: boolean) => void;
  animateScrolling: (isScrolling: boolean) => void;
  animateClickable: (isClickable: boolean) => void;
  cleanup: () => void;
}

/**
 * Initialise toutes les animations GSAP pour le curseur personnalisé
 * @param refs - Les références aux éléments DOM nécessaires
 * @param gsap - Instance GSAP chargée
 * @returns Les contrôles d'animation (moveTo, animateClick, etc.)
 */
export function initCursorAnimations(
  refs: CursorAnimationRefs,
  gsap: typeof import('gsap')['default']
): CursorAnimationControls {
  const { cursorElement, outerSvg, innerSvgContainer } = refs;

  // Récupérer le circle du outerSvg pour animer strokeDashoffset
  const circle = outerSvg.querySelector('circle') as SVGCircleElement | null;
  if (!circle) {
    throw new Error('Circle element not found in outerSvg');
  }

  // Animation de mouvement avec quickTo (haute performance)
  const xTo = gsap.quickTo(cursorElement, 'x', {
    duration: 0.3,
    ease: 'power2.out',
  });
  
  const yTo = gsap.quickTo(cursorElement, 'y', {
    duration: 0.3,
    ease: 'power2.out',
  });

  // Initialiser la position au centre de l'écran
  const initialX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
  const initialY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
  gsap.set(cursorElement, {
    x: initialX,
    y: initialY,
    xPercent: -50,
    yPercent: -50,
  });

  // Initialiser l'état de l'outerSvg (scale) et du circle (strokeDashoffset)
  // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
  gsap.set(outerSvg, {
    scaleX: 1,
    scaleY: 1,
  });
  gsap.set(circle, {
    strokeDashoffset: 0,
  });

  // Animation de clic (scale du SVG interne)
  // On récupère le SVG à chaque fois car il peut changer (Click vs Arrow)
  let clickAnimation: gsap.core.Tween | null = null;
  const animateClick = (isClicking: boolean) => {
    const innerSvg = innerSvgContainer.querySelector('svg') as SVGSVGElement | null;
    if (!innerSvg) return;
    
    if (clickAnimation) {
      clickAnimation.kill();
    }

    // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
    clickAnimation = gsap.to(innerSvg, {
      scaleX: isClicking ? 0.7 : 1,
      scaleY: isClicking ? 0.7 : 1,
      duration: 0.1,
      ease: 'power2.out',
    });
  };

  // Animation de scroll (scale du outerSvg et stroke-dashoffset du circle)
  let scrollAnimation: gsap.core.Timeline | null = null;
  const animateScrolling = (isScrolling: boolean) => {
    if (scrollAnimation) {
      scrollAnimation.kill();
      scrollAnimation = null;
    }

    if (isScrolling) {
      // Animation infinie de scale et stroke-dashoffset pendant le scroll
      // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
      scrollAnimation = gsap.timeline({ repeat: -1, yoyo: true });
      scrollAnimation
        .to(outerSvg, {
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 0.8,
          ease: 'power1.out',
        })
        .to(outerSvg, {
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 0.8,
          ease: 'power1.out',
        })
        .to(circle, {
          strokeDashoffset: 100,
          duration: 0.8,
          ease: 'power1.out',
        }, 0); // Commencer en même temps que le scale
    } else {
      // Retour à l'état initial quand le scroll s'arrête
      // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
      gsap.to(outerSvg, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(circle, {
        strokeDashoffset: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  };

  // Animation de hover/clickable (scale du outerSvg et stroke-dashoffset du circle)
  let clickableAnimation: gsap.core.Timeline | null = null;
  const animateClickable = (isClickable: boolean) => {
    if (clickableAnimation) {
      clickableAnimation.kill();
      clickableAnimation = null;
    }

    if (isClickable) {
      // Animation infinie de scale et stroke-dashoffset quand le curseur est sur un élément cliquable
      // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
      clickableAnimation = gsap.timeline({ repeat: -1, yoyo: true });
      clickableAnimation
        .to(outerSvg, {
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 0.8,
          ease: 'power1.out',
        })
        .to(outerSvg, {
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 0.8,
          ease: 'power1.out',
        })
        .to(circle, {
          strokeDashoffset: 100,
          duration: 0.8,
          ease: 'power1.out',
        }, 0); // Commencer en même temps que le scale
    } else {
      // Retour à l'état initial
      // Utiliser scaleX et scaleY au lieu de scale pour éviter l'erreur "scale not eligible for reset"
      gsap.to(outerSvg, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(circle, {
        strokeDashoffset: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  };

  // Fonction de nettoyage
  const cleanup = () => {
    if (clickAnimation) {
      clickAnimation.kill();
      clickAnimation = null;
    }
    if (scrollAnimation) {
      scrollAnimation.kill();
      scrollAnimation = null;
    }
    if (clickableAnimation) {
      clickableAnimation.kill();
      clickableAnimation = null;
    }
  };

  return {
    moveTo: (x: number, y: number) => {
      xTo(x);
      yTo(y);
    },
    animateClick,
    animateScrolling,
    animateClickable,
    cleanup,
  };
}

/**
 * Hook personnalisé qui encapsule toute la logique d'animation du curseur
 * @param refs - Les références aux éléments DOM nécessaires
 */
export function useCursorAnimations(refs: {
  cursorElement: React.RefObject<HTMLDivElement | null>;
  outerSvg: React.RefObject<SVGSVGElement | null>;
  innerSvgContainer: React.RefObject<HTMLDivElement | null>;
}) {
  const animationControlsRef = useRef<ReturnType<typeof initCursorAnimations> | null>(null);
  const [gsap, setGSAP] = useState<typeof import('gsap')['default'] | null>(null);

  // Utiliser l'état global Redux
  const { isClickable } = useSelector((state: RootState) => state.cursor);
  const { isScrolling } = useSelector((state: RootState) => state.scroll);

  // Lazy load GSAP
  useEffect(() => {
    loadGSAP().then((loadedGSAP) => {
      setGSAP(loadedGSAP);
    });
  }, []);

  // Initialiser les animations GSAP
  useEffect(() => {
    if (!refs.cursorElement.current || !refs.outerSvg.current || !refs.innerSvgContainer.current || !gsap) return;

    animationControlsRef.current = initCursorAnimations(
      {
        cursorElement: refs.cursorElement.current,
        outerSvg: refs.outerSvg.current,
        innerSvgContainer: refs.innerSvgContainer.current,
      },
      gsap
    );

    return () => {
      if (animationControlsRef.current) {
        animationControlsRef.current.cleanup();
        animationControlsRef.current = null;
      }
    };
  }, [refs.cursorElement, refs.outerSvg, refs.innerSvgContainer, gsap]);

  // Gérer les animations de scroll
  useEffect(() => {
    if (animationControlsRef.current) {
      animationControlsRef.current.animateScrolling(isScrolling);
    }
  }, [isScrolling]);

  // Gérer les animations de clickable
  useEffect(() => {
    if (animationControlsRef.current) {
      animationControlsRef.current.animateClickable(isClickable);
    }
  }, [isClickable]);

  // Gérer le mouvement de la souris
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (animationControlsRef.current) {
      animationControlsRef.current.moveTo(e.clientX, e.clientY);
    }
  }, []);

  // Gérer le clic
  const handleMouseDown = useCallback(() => {
    if (animationControlsRef.current) {
      animationControlsRef.current.animateClick(true);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (animationControlsRef.current) {
      animationControlsRef.current.animateClick(false);
    }
  }, []);

  // Ajouter les event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);
}

