import { ScrollInitializationUseCase } from './ScrollInitializationUseCase';
import { ScrollInitializationService, type PathDomainLike } from '../domain/ScrollInitializationService';

describe('ScrollInitializationUseCase', () => {
  let useCase: ScrollInitializationUseCase;
  let mockService: ScrollInitializationService;
  let mockPathDomain: {
    getComponentByAnchorId: jest.Mock;
  };
  let mockDispatch: jest.Mock;
  let mockWindowScrollTo: jest.SpyInstance;
  let rafCallbacks: Array<() => void> = [];

  beforeEach(() => {
    localStorage.clear();
    mockService = new ScrollInitializationService();
    mockPathDomain = {
      getComponentByAnchorId: jest.fn(),
    };
    mockDispatch = jest.fn();
    mockWindowScrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    
    // Mock requestAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      rafCallbacks.push(() => callback(0));
      return 1;
    });

    useCase = new ScrollInitializationUseCase(mockService);
    rafCallbacks = [];
  });

  afterEach(() => {
    localStorage.clear();
    mockWindowScrollTo.mockRestore();
    jest.restoreAllMocks();
    rafCallbacks = [];
  });

  const flushRaf = () => {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach(cb => cb());
  };

  describe('initializeProgress', () => {
    const globalPathLength = 2000;
    const windowHeight = 800;

    beforeEach(() => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: windowHeight,
      });
    });

    it('devrait utiliser le progress du hash si présent (priorité)', () => {
      const hash = '#projectsBanner';
      const mockComponent = {
        id: 'test',
        type: 'Test',
        position: { progress: 0.3 },
        anchorId: 'projectsBanner',
      };
      mockPathDomain.getComponentByAnchorId.mockReturnValue(mockComponent);

      const result = useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      expect(result.progress).toBe(0.3);
      expect(result.source).toBe('hash');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'scroll/setProgress', payload: 0.3 });
      expect(mockPathDomain.getComponentByAnchorId).toHaveBeenCalledWith('projectsBanner', true);
    });

    it('devrait utiliser le progress du localStorage si pas de hash mais progress sauvegardé', () => {
      const hash = '';
      localStorage.setItem('scrollProgress', '0.75');

      const result = useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      expect(result.progress).toBe(0.75);
      expect(result.source).toBe('storage');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'scroll/setProgress', payload: 0.75 });
      expect(mockPathDomain.getComponentByAnchorId).not.toHaveBeenCalled();
    });

    it('devrait utiliser le progress par défaut si pas de hash et pas de localStorage', () => {
      const hash = '';
      localStorage.clear();

      const result = useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      expect(result.progress).toBe(0.005);
      expect(result.source).toBe('default');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'scroll/setProgress', payload: 0.005 });
      expect(mockPathDomain.getComponentByAnchorId).not.toHaveBeenCalled();
    });

    it('devrait utiliser le progress du localStorage si le composant du hash n\'est pas trouvé', () => {
      const hash = '#unknown';
      mockPathDomain.getComponentByAnchorId.mockReturnValue(undefined);
      localStorage.setItem('scrollProgress', '0.6');

      const result = useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      expect(result.progress).toBe(0.6);
      expect(result.source).toBe('storage');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'scroll/setProgress', payload: 0.6 });
    });

    it('devrait utiliser le progress par défaut si le composant du hash n\'est pas trouvé et pas de localStorage', () => {
      const hash = '#unknown';
      mockPathDomain.getComponentByAnchorId.mockReturnValue(undefined);
      localStorage.clear();

      const result = useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      expect(result.progress).toBe(0.005);
      expect(result.source).toBe('default');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'scroll/setProgress', payload: 0.005 });
    });

    it('devrait prioriser le hash sur le localStorage', () => {
      const hash = '#projectsBanner';
      localStorage.setItem('scrollProgress', '0.8');
      const mockComponent = {
        id: 'test',
        type: 'Test',
        position: { progress: 0.3 },
        anchorId: 'projectsBanner',
      };
      mockPathDomain.getComponentByAnchorId.mockReturnValue(mockComponent);

      const result = useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      expect(result.progress).toBe(0.3);
      expect(result.source).toBe('hash');
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'scroll/setProgress', payload: 0.3 });
    });

    it('devrait calculer la position de scroll correctement pour le hash', () => {
      const hash = '#projectsBanner';
      const progress = 0.3;
      const mockComponent = {
        id: 'test',
        type: 'Test',
        position: { progress },
        anchorId: 'projectsBanner',
      };
      mockPathDomain.getComponentByAnchorId.mockReturnValue(mockComponent);

      useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      // Flush les callbacks RAF (double RAF)
      flushRaf();
      flushRaf();

      // Vérifier que scrollTo a été appelé avec les bons paramètres
      expect(mockWindowScrollTo).toHaveBeenCalled();
      const callArgs = mockWindowScrollTo.mock.calls[0][0];
      expect(callArgs).toHaveProperty('top');
      expect(callArgs).toHaveProperty('behavior', 'instant');
    });

    it('devrait calculer la position de scroll correctement pour le progress par défaut', () => {
      const hash = '';

      useCase.initializeProgress(
        hash,
        globalPathLength,
        mockPathDomain as PathDomainLike,
        true,
        mockDispatch
      );

      // Flush les callbacks RAF (double RAF)
      flushRaf();
      flushRaf();

      expect(mockWindowScrollTo).toHaveBeenCalled();
      const callArgs = mockWindowScrollTo.mock.calls[0][0];
      expect(callArgs).toHaveProperty('top');
      expect(callArgs).toHaveProperty('behavior', 'instant');
    });
  });

  describe('shouldSkipManualScrollInitialization', () => {
    it('devrait retourner true si un hash est présent', () => {
      expect(useCase.shouldSkipManualScrollInitialization('#projectsBanner')).toBe(true);
      expect(useCase.shouldSkipManualScrollInitialization('#openModal')).toBe(true);
    });

    it('devrait retourner false si pas de hash', () => {
      expect(useCase.shouldSkipManualScrollInitialization('')).toBe(false);
      expect(useCase.shouldSkipManualScrollInitialization(undefined as unknown as string)).toBe(false);
    });
  });
});

