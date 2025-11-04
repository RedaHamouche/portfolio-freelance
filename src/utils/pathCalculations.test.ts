import {
  findNextComponentInDirection,
  calculateArrowPosition,
} from './pathCalculations';

jest.mock('@/templating/config/pathComponents.json', () => [
  {
    id: '1',
    type: 'ProjectCard',
    displayName: 'Projet 1',
    anchorId: 'proj1',
    position: { progress: 0.1 },
  },
  {
    id: '2',
    type: 'ProjectCard',
    displayName: 'Projet 2',
    anchorId: 'proj2',
    position: { progress: 0.5 },
  },
  {
    id: '3',
    type: 'ProjectCard',
    displayName: 'Projet 3',
    anchorId: 'proj3',
    position: { progress: 0.8 },
  },
]);

describe('findNextComponentInDirection', () => {
  describe('direction forward', () => {
    it('devrait trouver le prochain composant en avant', () => {
      const currentProgress = 0.3;
      const result = findNextComponentInDirection(currentProgress, 'forward');
      expect(result).toBeDefined();
      expect(result?.position.progress).toBe(0.5); // Projet 2
      expect(result?.position.progress).toBeGreaterThan(currentProgress);
    });

    it('devrait boucler au début si on est à la fin', () => {
      const currentProgress = 0.9;
      const result = findNextComponentInDirection(currentProgress, 'forward');
      expect(result).toBeDefined();
      // Devrait retourner le premier composant (progress le plus petit)
      expect(result?.position.progress).toBe(0.1);
    });

    it('devrait trouver le composant juste après le progress actuel', () => {
      const currentProgress = 0.6;
      const result = findNextComponentInDirection(currentProgress, 'forward');
      expect(result).toBeDefined();
      expect(result?.position.progress).toBe(0.8); // Projet 3
    });
  });

  describe('direction backward', () => {
    it('devrait trouver le prochain composant en arrière', () => {
      const currentProgress = 0.6;
      const result = findNextComponentInDirection(currentProgress, 'backward');
      expect(result).toBeDefined();
      expect(result?.position.progress).toBe(0.5); // Projet 2
      expect(result?.position.progress).toBeLessThan(currentProgress);
    });

    it('devrait boucler à la fin si on est au début', () => {
      const currentProgress = 0.05;
      const result = findNextComponentInDirection(currentProgress, 'backward');
      expect(result).toBeDefined();
      // Devrait retourner le dernier composant (progress le plus grand)
      expect(result?.position.progress).toBe(0.8);
    });

    it('devrait trouver le composant juste avant le progress actuel', () => {
      const currentProgress = 0.4;
      const result = findNextComponentInDirection(currentProgress, 'backward');
      expect(result).toBeDefined();
      expect(result?.position.progress).toBe(0.1); // Projet 1
    });
  });

  describe('direction null', () => {
    it('devrait utiliser la logique par défaut quand direction est null', () => {
      const currentProgress = 0.3;
      const result = findNextComponentInDirection(currentProgress, null);
      expect(result).toBeDefined();
      // Devrait trouver un composant (logique originale)
    });
  });

  describe('cas limites', () => {
    it('devrait gérer progress = 0', () => {
      const result = findNextComponentInDirection(0, 'forward');
      expect(result).toBeDefined();
    });

    it('devrait gérer progress = 1', () => {
      const result = findNextComponentInDirection(1, 'backward');
      expect(result).toBeDefined();
    });

    it('devrait gérer progress exactement sur un composant', () => {
      const result = findNextComponentInDirection(0.5, 'forward');
      expect(result).toBeDefined();
      // Devrait trouver le prochain composant après 0.5
      if (result) {
        expect(result.position.progress).toBeGreaterThan(0.5);
      }
    });
  });
});

describe('calculateArrowPosition', () => {
  it('devrait retourner "right" pour direction forward', () => {
    const result = calculateArrowPosition('forward');
    expect(result).toBe('right');
  });

  it('devrait retourner "left" pour direction backward', () => {
    const result = calculateArrowPosition('backward');
    expect(result).toBe('left');
  });

  it('devrait retourner "right" par défaut pour direction null', () => {
    const result = calculateArrowPosition(null);
    expect(result).toBe('right');
  });
});

