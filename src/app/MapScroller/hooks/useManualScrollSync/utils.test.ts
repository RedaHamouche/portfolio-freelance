/**
 * Tests unitaires pour les fonctions utilitaires de useManualScrollSync
 */

import { DEFAULT_PATH_LENGTH } from '@/config';

/**
 * Fonction utilitaire pour détecter si un élément est interactif
 * Extrait de useManualScrollSync pour les tests
 */
function isInteractiveElement(target: HTMLElement | null): boolean {
  if (!target) return false;
  
  return (
    target.tagName === 'BUTTON' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'SELECT' ||
    target.tagName === 'TEXTAREA' ||
    !!target.closest('button') ||
    !!target.closest('input') ||
    !!target.closest('select') ||
    !!target.closest('textarea') ||
    !!target.closest('[role="button"]')
  );
}

/**
 * Fonction utilitaire pour détecter si on doit réinitialiser à cause d'un changement de pathLength
 * Extrait de useManualScrollSync pour les tests
 */
function shouldReinitializeForPathLength(
  currentPathLength: number,
  lastInitializedPathLength: number,
  isInitialized: boolean
): boolean {
  const pathLengthChanged = lastInitializedPathLength !== currentPathLength;
  const wasDefaultValue = lastInitializedPathLength <= DEFAULT_PATH_LENGTH;
  const isRealValue = currentPathLength > DEFAULT_PATH_LENGTH;
  
  return pathLengthChanged && wasDefaultValue && isRealValue && isInitialized;
}

describe('useManualScrollSync - Fonctions utilitaires', () => {
  describe('isInteractiveElement', () => {
    it('devrait retourner false pour null', () => {
      expect(isInteractiveElement(null)).toBe(false);
    });

    it('devrait retourner true pour un élément BUTTON', () => {
      const button = document.createElement('button');
      expect(isInteractiveElement(button)).toBe(true);
    });

    it('devrait retourner true pour un élément INPUT', () => {
      const input = document.createElement('input');
      expect(isInteractiveElement(input)).toBe(true);
    });

    it('devrait retourner true pour un élément SELECT', () => {
      const select = document.createElement('select');
      expect(isInteractiveElement(select)).toBe(true);
    });

    it('devrait retourner true pour un élément TEXTAREA', () => {
      const textarea = document.createElement('textarea');
      expect(isInteractiveElement(textarea)).toBe(true);
    });

    it('devrait retourner true pour un élément avec un parent button', () => {
      const button = document.createElement('button');
      const span = document.createElement('span');
      button.appendChild(span);
      expect(isInteractiveElement(span)).toBe(true);
    });

    it('devrait retourner true pour un élément avec role="button"', () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      expect(isInteractiveElement(div)).toBe(true);
    });

    it('devrait retourner true pour un élément avec un parent ayant role="button"', () => {
      const parent = document.createElement('div');
      parent.setAttribute('role', 'button');
      const child = document.createElement('span');
      parent.appendChild(child);
      expect(isInteractiveElement(child)).toBe(true);
    });

    it('devrait retourner false pour un élément DIV normal', () => {
      const div = document.createElement('div');
      expect(isInteractiveElement(div)).toBe(false);
    });

    it('devrait retourner false pour un élément SPAN normal', () => {
      const span = document.createElement('span');
      expect(isInteractiveElement(span)).toBe(false);
    });
  });

  describe('shouldReinitializeForPathLength', () => {
    it('devrait retourner false si pas encore initialisé', () => {
      const result = shouldReinitializeForPathLength(5000, DEFAULT_PATH_LENGTH, false);
      expect(result).toBe(false);
    });

    it('devrait retourner false si le pathLength n\'a pas changé', () => {
      const result = shouldReinitializeForPathLength(5000, 5000, true);
      expect(result).toBe(false);
    });

    it('devrait retourner false si le dernier pathLength n\'était pas la valeur par défaut', () => {
      const result = shouldReinitializeForPathLength(6000, 5000, true);
      expect(result).toBe(false);
    });

    it('devrait retourner false si le nouveau pathLength n\'est pas une vraie valeur', () => {
      const result = shouldReinitializeForPathLength(DEFAULT_PATH_LENGTH, DEFAULT_PATH_LENGTH - 100, true);
      expect(result).toBe(false);
    });

    it('devrait retourner true si toutes les conditions sont remplies', () => {
      const result = shouldReinitializeForPathLength(5000, DEFAULT_PATH_LENGTH, true);
      expect(result).toBe(true);
    });

    it('devrait retourner true même si le nouveau pathLength est très grand', () => {
      const result = shouldReinitializeForPathLength(10000, DEFAULT_PATH_LENGTH, true);
      expect(result).toBe(true);
    });

    it('devrait retourner false si le dernier pathLength était déjà une vraie valeur', () => {
      const result = shouldReinitializeForPathLength(6000, 5000, true);
      expect(result).toBe(false);
    });
  });
});

