import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  enabled?: boolean;
  onEscape?: () => void;
}

/**
 * Hook personnalisé pour gérer le focus trap dans une modal
 * Garde le focus à l'intérieur de l'élément et permet de fermer avec ESC
 */
export const useFocusTrap = <T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
) => {
  const { enabled = true, onEscape } = options;
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Sauvegarder l'élément focalisé avant l'activation du trap
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Gestion de la touche ESC
      if (e.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      // Gestion du focus trap avec Tab
      if (e.key === 'Tab') {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus sur le conteneur au montage
    const timeout = setTimeout(() => {
      container.focus();
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
      // Restaurer le focus
      previousFocusRef.current?.focus();
    };
  }, [enabled, onEscape]);

  return containerRef;
};

