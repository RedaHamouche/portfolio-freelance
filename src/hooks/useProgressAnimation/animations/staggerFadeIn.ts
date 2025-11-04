/**
 * Animation d'apparition de lettres avec stagger
 */

import gsap from 'gsap';
import { AnimationState } from '../types';
import { AnimationContext, AnimationResult, ComplexAnimation } from './base';
import { StaggerFadeInAnimationConfig } from '../types';
import { normalizeProgress } from '../utils';

/**
 * Calcule l'opacité de base pour le conteneur
 */
function calculate(
  _state: AnimationState,
  context: AnimationContext,
  config: StaggerFadeInAnimationConfig
): AnimationResult {
  const { progress } = context;
  const { startProgress = 0, endProgress = 1 } = config;

  const staggerProgress = normalizeProgress(progress, startProgress, endProgress);
  return {
    opacity: staggerProgress > 0 ? 1 : 0,
  };
}

/**
 * Initialise le DOM pour le stagger (divise le texte en lettres)
 */
function setup(
  elementRef: React.RefObject<HTMLElement>
): void {
  if (!elementRef.current) return;

  // Trouver tous les éléments texte dans le composant
  const textElements = elementRef.current.querySelectorAll('h1, h2, h3, p');
  
  if (textElements.length === 0) return;

  // Pour chaque élément texte, créer un effet de stagger sur les lettres
  textElements.forEach((element) => {
    const text = element.textContent || '';
    if (!text || element.querySelector('.letter')) return; // Déjà initialisé

    // Diviser le texte en lettres (en préservant les espaces)
    const letters = text.split('').map((char) => {
      if (char === ' ') return ' ';
      return `<span class="letter" style="display: inline-block; opacity: 0;">${char}</span>`;
    });

    // Créer un wrapper pour les lettres
    const wrapper = document.createElement('span');
    wrapper.innerHTML = letters.join('');
    
    // Remplacer le contenu
    element.innerHTML = '';
    element.appendChild(wrapper);
  });
}

/**
 * Met à jour l'animation des lettres basé sur le progress
 */
function update(
  elementRef: React.RefObject<HTMLElement>,
  context: AnimationContext,
  config: StaggerFadeInAnimationConfig
): void {
  if (!elementRef.current) return;

  const { progress } = context;
  const { 
    startProgress = 0, 
    endProgress = 1, 
    slideDistance = 20, 
    withSlide = true,
    duration = 0.1,
  } = config;

  const normalizedProgress = normalizeProgress(progress, startProgress, endProgress);

  // Trouver toutes les lettres
  const letterSpans = elementRef.current.querySelectorAll('.letter');
  if (letterSpans.length === 0) return;

  const totalLetters = letterSpans.length;

  // Tuer toutes les animations GSAP en cours sur les lettres avant d'en créer de nouvelles
  // Cela évite d'accumuler des animations si le progress change rapidement
  letterSpans.forEach((letter) => {
    gsap.killTweensOf(letter as HTMLElement);
  });

  // Animer chaque lettre basé sur le progress
  letterSpans.forEach((letter, index) => {
    // Calculer le progress pour cette lettre spécifique
    const letterStartProgress = index / totalLetters;
    const letterEndProgress = (index + 1) / totalLetters;
    
    // Éviter la division par zéro (ne devrait pas arriver, mais sécurité)
    const letterProgressRange = letterEndProgress - letterStartProgress;
    if (letterProgressRange === 0) return;
    
    // Normaliser le progress pour cette lettre
    const letterProgress = Math.max(0, Math.min(1, 
      (normalizedProgress - letterStartProgress) / letterProgressRange
    ));

    const opacity = letterProgress > 0 ? Math.min(letterProgress, 1) : 0;
    const y = withSlide ? (1 - opacity) * slideDistance : 0;

    gsap.to(letter as HTMLElement, {
      opacity,
      y,
      duration,
      ease: 'power2.out',
    });
  });
}

export const staggerFadeInAnimation: ComplexAnimation<StaggerFadeInAnimationConfig> = {
  type: 'staggerFadeIn',
  calculate,
  setup,
  update,
};

