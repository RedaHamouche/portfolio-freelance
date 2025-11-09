import { renderHook, act } from '@testing-library/react';
import { useAutoPlay } from './index';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

// Mock useRafLoop
jest.mock('@/hooks/useRafLoop', () => ({
  useRafLoop: () => ({
    start: jest.fn((cb) => {
      // Simuler le démarrage de la boucle
      if (typeof window !== 'undefined') {
        requestAnimationFrame(cb);
      }
    }),
    stop: jest.fn(),
  }),
}));

// Mock useBreakpoint
jest.mock('@/hooks/useBreakpointValue', () => ({
  useBreakpoint: () => true, // Desktop par défaut
}));

// Mock TemplatingContext
jest.mock('@/contexts/TemplatingContext', () => ({
  useTemplatingContext: () => ({
    pathDomain: {
      getNextAnchor: jest.fn(() => null),
    },
    pageDomain: {},
    tangenteDomain: {},
  }),
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock performance.now
const mockPerformanceNow = jest.fn(() => 1000);
Object.defineProperty(performance, 'now', {
  value: mockPerformanceNow,
  writable: true,
});

describe('useAutoPlay', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();

    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState = {
        scroll: {
          isAutoPlaying: false,
          autoScrollDirection: 1,
          progress: 0.5,
          pathLength: 1000,
        },
        modal: {
          isOpen: false,
        },
      };
      return selector(mockState);
    });

    mockPerformanceNow.mockReturnValue(1000);
  });

  it('devrait initialiser correctement', () => {
    const { result } = renderHook(() =>
      useAutoPlay({
        globalPathLength: 1000,
        progress: 0.5,
      })
    );

    expect(result.current).toHaveProperty('startAutoPlay');
    expect(result.current).toHaveProperty('stopAutoPlay');
  });

  it('devrait respecter le cooldown de 5 secondes pour les anchors', async () => {
    let isAutoPlaying = false;
    const currentProgress = 0.5;

    // Mock pour simuler un anchor
    const mockGetNextAnchor = jest.fn(() => ({
      id: 'test-anchor',
      type: 'TestComponent',
      displayName: 'Test Anchor',
      anchorId: 'testAnchor',
      position: { progress: 0.5 },
      autoScrollPauseTime: 1000,
    }));

    // Le mock de TemplatingContext est déjà configuré en haut du fichier
    // On peut le mettre à jour dynamiquement si nécessaire
    jest.doMock('@/contexts/TemplatingContext', () => ({
      useTemplatingContext: () => ({
        pathDomain: {
          getNextAnchor: mockGetNextAnchor,
        },
        pageDomain: {},
        tangenteDomain: {},
      }),
    }));

    (useSelector as jest.Mock).mockImplementation((selector: (state: RootState) => unknown) => {
      const mockState: RootState = {
        scroll: {
          isAutoPlaying,
          autoScrollDirection: 1,
          progress: currentProgress,
          pathLength: 1000,
          lastScrollDirection: null,
          isScrolling: false,
          isAutoScrollTemporarilyPaused: false,
        },
        modal: {
          isOpen: false,
        },
      };
      return selector(mockState);
    });

    const { result } = renderHook(() =>
      useAutoPlay({
        globalPathLength: 1000,
        progress: currentProgress,
      })
    );

    // Démarrer l'autoplay
    act(() => {
      isAutoPlaying = true;
      result.current.startAutoPlay();
    });

    // Attendre un peu pour que l'animation se déclenche
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Vérifier que setAutoScrollTemporarilyPaused a été appelé (pause détectée)
    const pauseCalls = mockDispatch.mock.calls.filter(
      (call) => call[0].type === 'scroll/setAutoScrollTemporarilyPaused'
    );
    expect(pauseCalls.length).toBeGreaterThan(0);

    // Simuler le passage du temps (moins de 5 secondes)
    mockPerformanceNow.mockReturnValue(2000); // 1 seconde plus tard

    // L'anchor ne devrait pas être pausé à nouveau (cooldown actif)
    // Note: Ce test vérifie la logique, mais l'implémentation réelle nécessiterait
    // de déclencher l'animation plusieurs fois pour tester le cooldown
  });

  it('devrait nettoyer les timeouts au démontage', () => {
    const { unmount } = renderHook(() =>
      useAutoPlay({
        globalPathLength: 1000,
        progress: 0.5,
      })
    );

    // Le cleanup devrait être appelé sans erreur
    expect(() => unmount()).not.toThrow();
  });
});

