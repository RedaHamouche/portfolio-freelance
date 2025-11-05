import React from 'react';
import styles from './index.module.scss';
import { useProgressAnimation } from '@/hooks/useProgressAnimation';

export type TitleAboutMeType = {
  title: string;
  description: string;
  componentProgress?: number; // Position du composant sur le path (0-1)
}

export default function TitleAboutMe({ 
  title,
  description,
  componentProgress = 0 // Par défaut au début si non fourni
}: TitleAboutMeType) {
  // Animation d'apparition de lettres avec fondu progressif
  // L'animation se déclenche relativement à la position du composant sur le path
  // Gère le wraparound (0 ↔ 1) pour le scroll infini
  const animationRange = 0.008; // 0.8% avant et après la position du composant (réduit pour finir plus tôt)
  
  // Calculer startProgress et endProgress en gérant le wraparound
  let startProgress = componentProgress - animationRange;
  let endProgress = componentProgress + animationRange;
  
  // Si startProgress < 0, on traverse la boucle (ex: -0.01 → 0.99)
  // Si endProgress > 1, on traverse la boucle (ex: 1.01 → 0.01)
  // Dans ce cas, on garde les valeurs telles quelles pour que normalizeProgress gère le wraparound
  // Mais on doit normaliser pour éviter les valeurs négatives ou > 1 qui pourraient poser problème
  if (startProgress < 0) {
    startProgress = (startProgress + 1) % 1; // Normaliser avec modulo
  }
  if (endProgress > 1) {
    endProgress = endProgress % 1; // Normaliser avec modulo
  }
  
  // Si après normalisation, startProgress > endProgress, alors la plage traverse la boucle
  // C'est OK, normalizeProgress gérera ça
  const elementRef = useProgressAnimation<HTMLDivElement>({
    animations: [
      {
        type: 'staggerFadeIn',
        startProgress: startProgress,
        endProgress: endProgress,
        staggerDelay: 0.001, // 1ms entre chaque lettre (quasi instantané)
        duration: 0.01, // Durée de chaque lettre (très court)
        withSlide: true, // Ajouter un effet de slide
        slideDistance: 10, // Distance du slide en pixels (augmenté pour partir de plus bas)
      },
    ],
  });

  return (
    <div ref={elementRef} className={styles.titleAboutMe}>
      {title && <h1 className={styles.title}>{title}</h1>}
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}