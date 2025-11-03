import { useEffect, RefObject } from 'react';

interface UseOnClickOutsideOptions<T extends HTMLElement = HTMLElement> {
  ref: RefObject<T | null>;
  handler: (event: MouseEvent | TouchEvent) => void;
  enabled?: boolean;
}

/**
 * Hook personnalisé pour détecter les clics en dehors d'un élément
 * Utile pour fermer une modal ou un menu déroulant quand on clique à l'extérieur
 */
export const useOnClickOutside = <T extends HTMLElement = HTMLElement>({
  ref,
  handler,
  enabled = true,
}: UseOnClickOutsideOptions<T>) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Ne rien faire si l'élément n'existe pas
      if (!ref.current) return;

      // Ne rien faire si le clic est à l'intérieur de l'élément
      if (ref.current.contains(event.target as Node)) return;

      // Appeler le handler si le clic est à l'extérieur
      handler(event);
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      // Nettoyer les écouteurs
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [ref, handler, enabled]);
};

