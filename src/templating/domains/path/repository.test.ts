import { PathRepository } from './repository';

// Mock des fichiers JSON
jest.mock('../../config/desktop/pathComponents.json', () => [
  {
    id: 'comp1',
    type: 'ProjectCard',
    displayName: 'Component 1',
    anchorId: 'anchor1',
    position: { progress: 0.2 },
    autoScrollPauseTime: 1000,
  },
  {
    id: 'comp2',
    type: 'ProjectCard',
    displayName: 'Component 2',
    anchorId: 'anchor2',
    position: { progress: 0.5 },
    autoScrollPauseTime: 2000,
  },
  {
    id: 'comp3',
    type: 'ProjectCard',
    displayName: 'Component 3',
    position: { progress: 0.8 }, // Pas d'anchorId
  },
], { virtual: true });

jest.mock('../../config/mobile/pathComponents.json', () => [
  {
    id: 'comp1-mobile',
    type: 'ProjectCard',
    displayName: 'Component 1 Mobile',
    anchorId: 'anchor1-mobile',
    position: { progress: 0.3 },
  },
], { virtual: true });

describe('PathRepository - Optimisations', () => {
  let repository: PathRepository;

  beforeEach(() => {
    repository = new PathRepository();
  });

  describe('Indexation O(1)', () => {
    it('devrait créer des index au chargement', () => {
      const config = repository.load(true);
      expect(config.length).toBeGreaterThan(0);
    });

    it('devrait récupérer un composant par ID en O(1)', () => {
      repository.load(true);
      const component = repository.getComponentById('comp1', true);
      
      expect(component).toBeDefined();
      expect(component?.id).toBe('comp1');
      expect(component?.anchorId).toBe('anchor1');
    });

    it('devrait récupérer un composant par anchorId en O(1)', () => {
      repository.load(true);
      const component = repository.getComponentByAnchorId('anchor1', true);
      
      expect(component).toBeDefined();
      expect(component?.id).toBe('comp1');
      expect(component?.anchorId).toBe('anchor1');
    });

    it('devrait retourner undefined pour un ID inexistant', () => {
      repository.load(true);
      const component = repository.getComponentById('inexistant', true);
      expect(component).toBeUndefined();
    });

    it('devrait gérer desktop et mobile séparément', () => {
      repository.load(true);
      repository.load(false);
      
      const desktop = repository.getComponentById('comp1', true);
      const mobile = repository.getComponentById('comp1-mobile', false);
      
      expect(desktop?.id).toBe('comp1');
      expect(mobile?.id).toBe('comp1-mobile');
    });

    it('devrait invalider les index lors du reload', () => {
      repository.load(true);
      const before = repository.getComponentById('comp1', true);
      expect(before).toBeDefined();
      
      repository.reload(true);
      const after = repository.getComponentById('comp1', true);
      expect(after).toBeDefined();
    });
  });
});

