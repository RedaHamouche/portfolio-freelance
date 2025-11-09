import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setClickable } from '@/store/cursorSlice';

// Fonction utilitaire pour détecter si un élément est clickable
const isClickable = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  // Vérifier si c'est un élément HTML avec les méthodes nécessaires
  if (!(element instanceof HTMLElement)) return false;
  
  return !!(
    element.tagName === 'A' || 
    element.tagName === 'BUTTON' || 
    element.hasAttribute('data-clickable') ||
    element.closest('a') ||
    element.closest('button') ||
    element.closest('[data-clickable]')
  );
};

export const useClickableElements = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (isClickable(target)) {
        dispatch(setClickable(true));
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (isClickable(target)) {
        dispatch(setClickable(false));
      }
    };

    // Ajouter les event listeners
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, [dispatch]);
}; 