/**
 * Animation d'apparition de lettres avec stagger
 */

import { loadGSAP } from '@/utils/gsap/lazyLoadGSAP';
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

    // Diviser le texte en mots (en préservant les espaces)
    // Chaque mot sera dans un span pour préserver l'intégrité des mots lors des retours à la ligne
    const words = text.split(/(\s+)/); // Split en gardant les espaces
    
    // Créer un wrapper pour les mots
    const wrapper = document.createElement('span');
    wrapper.className = 'text-wrapper';
    
    words.forEach((word) => {
      if (!word.trim()) {
        // C'est un espace, on le garde tel quel
        wrapper.appendChild(document.createTextNode(word));
      } else {
        // C'est un mot, on le wrapper dans un span avec les lettres
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap'; // Empêche la coupure du mot
        
        // Diviser le mot en lettres
        word.split('').forEach((char) => {
          const letterSpan = document.createElement('span');
          letterSpan.className = 'letter';
          letterSpan.style.display = 'inline-block';
          letterSpan.style.opacity = '0';
          letterSpan.textContent = char;
          wordSpan.appendChild(letterSpan);
        });
        
        wrapper.appendChild(wordSpan);
      }
    });
    
    // Remplacer le contenu
    element.innerHTML = '';
    element.appendChild(wrapper);
  });
}

/**
 * Met à jour l'animation des lettres basé sur le progress
 * GSAP est lazy loadé pour réduire le bundle initial
 */
async function update(
  elementRef: React.RefObject<HTMLElement>,
  context: AnimationContext,
  config: StaggerFadeInAnimationConfig
): Promise<void> {
  if (!elementRef.current) return;

  // Lazy load GSAP
  const gsap = await loadGSAP();

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

