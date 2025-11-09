import { binarySearchForward, binarySearchBackward } from './index';
import { findNextComponentInDirection, type PathComponentData } from '../index';

describe('Recherche binaire optimisée', () => {
  const createComponent = (id: string, progress: number): PathComponentData => ({
    id,
    type: 'ProjectCard',
    displayName: `Component ${id}`,
    anchorId: `anchor-${id}`,
    position: { progress },
  });

  describe('binarySearchForward', () => {
    it('devrait trouver le premier composant avec progress > target', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
        createComponent('4', 0.7),
        createComponent('5', 0.9),
      ];

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const result = binarySearchForward(sortedAsc, 0.4);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('3'); // 0.5 > 0.4, et c'est le plus proche
      expect(result?.position.progress).toBe(0.5);
    });

    it('devrait retourner null si aucun composant avec progress > target', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
      ];

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const result = binarySearchForward(sortedAsc, 0.9);
      
      expect(result).toBeNull();
    });
  });

  describe('binarySearchForward (via findNextComponentInDirection)', () => {
    it('devrait trouver le premier composant avec progress > target', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
        createComponent('4', 0.7),
        createComponent('5', 0.9),
      ];

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);

      const result = findNextComponentInDirection(0.4, 'forward', components, sortedAsc, sortedDesc);
      
      expect(result).toBeDefined();
      // Devrait trouver le plus proche avec progress > 0.4, donc '3' avec 0.5 (pas '4' avec 0.7)
      expect(result?.id).toBe('3'); // 0.5 > 0.4, et c'est le plus proche
      expect(result?.position.progress).toBe(0.5);
    });

    it('devrait boucler au début si aucun composant en avant', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
      ];

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);

      const result = findNextComponentInDirection(0.9, 'forward', components, sortedAsc, sortedDesc);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('1'); // Boucle au début
    });
  });

  describe('binarySearchBackward', () => {
    it('devrait trouver le premier composant avec progress < target', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
        createComponent('4', 0.7),
        createComponent('5', 0.9),
      ];

      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);
      const result = binarySearchBackward(sortedDesc, 0.6);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('3'); // 0.5 < 0.6
      expect(result?.position.progress).toBe(0.5);
    });

    it('devrait retourner null si aucun composant avec progress < target', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
      ];

      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);
      const result = binarySearchBackward(sortedDesc, 0.05);
      
      expect(result).toBeNull();
    });
  });

  describe('binarySearchBackward (via findNextComponentInDirection)', () => {
    it('devrait trouver le premier composant avec progress < target', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
        createComponent('4', 0.7),
        createComponent('5', 0.9),
      ];

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);

      const result = findNextComponentInDirection(0.6, 'backward', components, sortedAsc, sortedDesc);
      
      expect(result).toBeDefined();
      // Devrait trouver le plus proche avec progress < 0.6
      // Dans sortedDesc: [0.9, 0.7, 0.5, 0.3, 0.1]
      // Le plus proche de 0.6 qui est < 0.6 est 0.5
      expect(result?.id).toBe('3'); // 0.5 < 0.6
      expect(result?.position.progress).toBe(0.5);
    });

    it('devrait boucler à la fin si aucun composant en arrière', () => {
      const components = [
        createComponent('1', 0.1),
        createComponent('2', 0.3),
        createComponent('3', 0.5),
      ];

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);

      const result = findNextComponentInDirection(0.05, 'backward', components, sortedAsc, sortedDesc);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('3'); // Boucle à la fin
    });
  });

  describe('Performance - Complexité O(log n)', () => {
    it('devrait être plus rapide que .find() pour de grandes listes', () => {
      // Créer une grande liste de composants
      const components: PathComponentData[] = [];
      for (let i = 0; i < 1000; i++) {
        components.push(createComponent(`comp-${i}`, i / 1000));
      }

      const sortedAsc = [...components].sort((a, b) => a.position.progress - b.position.progress);
      const sortedDesc = [...components].sort((a, b) => b.position.progress - a.position.progress);

      const start = performance.now();
      const result = findNextComponentInDirection(0.5, 'forward', components, sortedAsc, sortedDesc);
      const end = performance.now();

      expect(result).toBeDefined();
      // La recherche binaire devrait être très rapide même pour 1000 éléments
      expect(end - start).toBeLessThan(10); // Moins de 10ms
    });
  });
});

