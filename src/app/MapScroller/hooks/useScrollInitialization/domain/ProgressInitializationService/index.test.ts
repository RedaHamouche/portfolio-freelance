/**
 * Tests pour ProgressInitializationService
 * 
 * Tests TDD pour garantir que les règles d'initialisation sont respectées :
 * 1. Hash (anchorID) → progress
 * 2. localStorage → progress sauvegardé
 * 3. Default → progress par défaut
 */

import { ProgressInitializationService, type PathDomainLike } from './index';
import { ProgressPersistenceService } from '../ProgressPersistenceService';

describe('ProgressInitializationService', () => {
  let service: ProgressInitializationService;
  let mockPathDomain: PathDomainLike;
  let mockPersistenceService: ProgressPersistenceService;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    
    // Mock du PathDomain
    mockPathDomain = {
      getComponentByAnchorId: jest.fn(),
    };

    // Mock du PersistenceService
    mockPersistenceService = {
      getProgress: jest.fn(),
      saveProgress: jest.fn(),
      clearProgress: jest.fn(),
      hasProgress: jest.fn(),
    } as unknown as ProgressPersistenceService;

    service = new ProgressInitializationService(mockPersistenceService);
  });

  describe('initializeProgress - Règle 1: Hash (anchorID) → progress', () => {
    it('devrait utiliser le progress du hash si présent et valide', () => {
      const mockComponent = {
        position: { progress: 0.3 },
      };
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(mockComponent);

      const result = service.initializeProgress('#projectsBanner', mockPathDomain);

      expect(result.progress).toBe(0.3);
      expect(result.source).toBe('hash');
      expect(result.anchorId).toBe('projectsBanner');
      expect(mockPathDomain.getComponentByAnchorId).toHaveBeenCalledWith('projectsBanner', true);
    });

    it('devrait retourner null si le composant n\'existe pas', () => {
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(undefined);
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(0.75);

      const result = service.initializeProgress('#invalidAnchor', mockPathDomain);

      expect(result.source).toBe('storage');
      expect(result.progress).toBe(0.75);
    });

    it('devrait retourner null si le composant n\'a pas de progress', () => {
      const mockComponent = {
        position: {},
      };
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(mockComponent);
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(0.6);

      const result = service.initializeProgress('#noProgress', mockPathDomain);

      expect(result.source).toBe('storage');
      expect(result.progress).toBe(0.6);
    });

    it('devrait retourner null si le progress est invalide (< 0 ou > 1)', () => {
      const mockComponent = {
        position: { progress: 1.5 },
      };
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(mockComponent);
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(0.8);

      const result = service.initializeProgress('#invalidProgress', mockPathDomain);

      expect(result.source).toBe('storage');
      expect(result.progress).toBe(0.8);
    });
  });

  describe('initializeProgress - Règle 2: localStorage → progress sauvegardé', () => {
    it('devrait utiliser le progress du localStorage si pas de hash valide', () => {
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(0.75);

      const result = service.initializeProgress(undefined, mockPathDomain);

      expect(result.progress).toBe(0.75);
      expect(result.source).toBe('storage');
    });

    it('devrait utiliser le progress du localStorage si hash invalide', () => {
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(undefined);
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(0.6);

      const result = service.initializeProgress('#invalid', mockPathDomain);

      expect(result.progress).toBe(0.6);
      expect(result.source).toBe('storage');
    });
  });

  describe('initializeProgress - Règle 3: Default → progress par défaut', () => {
    it('devrait utiliser le progress par défaut si pas de hash ni localStorage', () => {
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(null);

      const result = service.initializeProgress(undefined, mockPathDomain);

      expect(result.progress).toBe(0.005);
      expect(result.source).toBe('default');
    });

    it('devrait utiliser le progress par défaut si hash invalide et pas de localStorage', () => {
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(undefined);
      (mockPersistenceService.getProgress as jest.Mock).mockReturnValue(null);

      const result = service.initializeProgress('#invalid', mockPathDomain);

      expect(result.progress).toBe(0.005);
      expect(result.source).toBe('default');
    });
  });

  describe('hasValidHash', () => {
    it('devrait retourner true pour un hash valide', () => {
      expect(service.hasValidHash('#projectsBanner')).toBe(true);
      expect(service.hasValidHash('#openModal')).toBe(true);
    });

    it('devrait retourner false pour un hash vide', () => {
      expect(service.hasValidHash('')).toBe(false);
      expect(service.hasValidHash('#')).toBe(false);
      expect(service.hasValidHash('# ')).toBe(false);
    });

    it('devrait retourner false pour undefined/null', () => {
      expect(service.hasValidHash(undefined)).toBe(false);
      expect(service.hasValidHash(null)).toBe(false);
    });
  });

  describe('extractAnchorId', () => {
    it('devrait extraire l\'anchorID sans le #', () => {
      expect(service.extractAnchorId('#projectsBanner')).toBe('projectsBanner');
      expect(service.extractAnchorId('#openModal')).toBe('openModal');
    });

    it('devrait gérer les espaces', () => {
      expect(service.extractAnchorId('# projectsBanner ')).toBe('projectsBanner');
    });
  });

  describe('getProgressFromAnchorId', () => {
    it('devrait retourner le progress du composant si trouvé', () => {
      const mockComponent = {
        position: { progress: 0.4 },
      };
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(mockComponent);

      const progress = service.getProgressFromAnchorId('projectsBanner', mockPathDomain, true);

      expect(progress).toBe(0.4);
      expect(mockPathDomain.getComponentByAnchorId).toHaveBeenCalledWith('projectsBanner', true);
    });

    it('devrait retourner null si le composant n\'existe pas', () => {
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(undefined);

      const progress = service.getProgressFromAnchorId('invalid', mockPathDomain, true);

      expect(progress).toBeNull();
    });

    it('devrait retourner null si le progress est invalide', () => {
      const mockComponent = {
        position: { progress: -0.1 },
      };
      (mockPathDomain.getComponentByAnchorId as jest.Mock).mockReturnValue(mockComponent);

      const progress = service.getProgressFromAnchorId('invalid', mockPathDomain, true);

      expect(progress).toBeNull();
    });
  });

  describe('isValidProgress', () => {
    it('devrait valider les progress dans [0, 1]', () => {
      expect(service.isValidProgress(0)).toBe(true);
      expect(service.isValidProgress(0.5)).toBe(true);
      expect(service.isValidProgress(1)).toBe(true);
    });

    it('devrait rejeter les progress hors de [0, 1]', () => {
      expect(service.isValidProgress(-0.1)).toBe(false);
      expect(service.isValidProgress(1.1)).toBe(false);
    });

    it('devrait rejeter NaN', () => {
      expect(service.isValidProgress(NaN)).toBe(false);
    });
  });

  describe('getDefaultProgress', () => {
    it('devrait retourner 0.005', () => {
      expect(service.getDefaultProgress()).toBe(0.005);
    });
  });
});

