import { ScrollInitializationService, type PathDomainLike } from './ScrollInitializationService';

describe('ScrollInitializationService', () => {
  let service: ScrollInitializationService;
  let mockPathDomain: {
    getComponentByAnchorId: jest.MockedFunction<PathDomainLike['getComponentByAnchorId']>;
  };

  beforeEach(() => {
    mockPathDomain = {
      getComponentByAnchorId: jest.fn(),
    };
    service = new ScrollInitializationService();
  });

  describe('shouldUseHashProgress', () => {
    it('devrait retourner true si un hash est présent', () => {
      expect(service.shouldUseHashProgress('#projectsBanner')).toBe(true);
      expect(service.shouldUseHashProgress('#openModal')).toBe(true);
    });

    it('devrait retourner false si aucun hash', () => {
      expect(service.shouldUseHashProgress('')).toBe(false);
      expect(service.shouldUseHashProgress('#')).toBe(false);
    });

    it('devrait retourner false si hash est undefined', () => {
      expect(service.shouldUseHashProgress(undefined as unknown as string)).toBe(false);
    });
  });

  describe('extractHash', () => {
    it('devrait extraire le hash sans le #', () => {
      expect(service.extractHash('#projectsBanner')).toBe('projectsBanner');
      expect(service.extractHash('#openModal')).toBe('openModal');
    });

    it('devrait retourner une chaîne vide si pas de hash', () => {
      expect(service.extractHash('')).toBe('');
      expect(service.extractHash('#')).toBe('');
    });
  });

  describe('getProgressFromHash', () => {
    it('devrait retourner le progress du composant si trouvé', () => {
      const mockComponent = {
        id: 'test',
        type: 'Test',
        position: { progress: 0.3 },
        anchorId: 'projectsBanner',
      };
      mockPathDomain.getComponentByAnchorId.mockReturnValue(mockComponent);

      const result = service.getProgressFromHash('projectsBanner', mockPathDomain, true);

      expect(result).toBe(0.3);
      expect(mockPathDomain.getComponentByAnchorId).toHaveBeenCalledWith('projectsBanner', true);
    });

    it('devrait retourner null si le composant n\'est pas trouvé', () => {
      mockPathDomain.getComponentByAnchorId.mockReturnValue(undefined);

      const result = service.getProgressFromHash('unknown', mockPathDomain, true);

      expect(result).toBeNull();
    });

    it('devrait retourner null si le composant n\'a pas de progress', () => {
      const mockComponent = {
        id: 'test',
        type: 'Test',
        position: {},
        anchorId: 'projectsBanner',
      };
      mockPathDomain.getComponentByAnchorId.mockReturnValue(mockComponent);

      const result = service.getProgressFromHash('projectsBanner', mockPathDomain, true);

      expect(result).toBeNull();
    });
  });

  describe('getDefaultProgress', () => {
    it('devrait retourner 0.005 (0.5%) par défaut', () => {
      expect(service.getDefaultProgress()).toBe(0.005);
    });
  });

  describe('getProgressFromStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('devrait retourner null si aucun progress sauvegardé', () => {
      expect(service.getProgressFromStorage()).toBeNull();
    });

    it('devrait récupérer le progress depuis le localStorage', () => {
      localStorage.setItem('scrollProgress', '0.75');
      expect(service.getProgressFromStorage()).toBe(0.75);
    });
  });

  describe('saveProgress', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('devrait sauvegarder le progress dans le localStorage', () => {
      service.saveProgress(0.5);
      expect(localStorage.getItem('scrollProgress')).toBe('0.5');
    });
  });
});

