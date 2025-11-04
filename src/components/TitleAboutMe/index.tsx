import React from 'react';
import styles from './index.module.scss';
import { useProgressAnimation } from '@/hooks/useProgressAnimation';

export type TitleAboutMeType = {
  title: string;
  description: string;
}

export default function TitleAboutMe({ 
  title,
  description
}: TitleAboutMeType) {
  // Animation d'apparition de lettres avec fondu progressif
  const elementRef = useProgressAnimation<HTMLDivElement>({
    animations: [
      {
        type: 'staggerFadeIn',
        startProgress: 0, // Commence dès le début
        endProgress: 0.03, // Se termine à 3% du progress (ultra rapide)
        staggerDelay: 0.001, // 1ms entre chaque lettre (quasi instantané)
        duration: 0.05, // Durée de chaque lettre (très court)
        withSlide: true, // Ajouter un effet de slide
        slideDistance: 15, // Distance du slide en pixels
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