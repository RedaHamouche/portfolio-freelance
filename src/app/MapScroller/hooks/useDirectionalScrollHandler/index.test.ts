import { renderHook, act } from '@testing-library/react';
import { useDirectionalScrollHandler } from './index';

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn()
}));

// Mock useRafLoop
jest.mock('../../../../hooks/useRafLoop', () => ({
  useRafLoop: () => ({
    start: jest.fn(),
    stop: jest.fn()
  })
}));

describe('useDirectionalScrollHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne les fonctions start et stop', () => {
    const { result } = renderHook(() => useDirectionalScrollHandler({
      direction: 'bas',
      speed: 100,
      globalPathLength: 1000,
      progress: 0.5
    }));

    expect(result.current.startDirectionalScroll).toBeDefined();
    expect(result.current.stopDirectionalScroll).toBeDefined();
  });

  it('gère la direction vers le bas', () => {
    const { result } = renderHook(() => useDirectionalScrollHandler({
      direction: 'bas',
      speed: 100,
      globalPathLength: 1000,
      progress: 0.5
    }));

    act(() => {
      result.current.startDirectionalScroll();
    });

    // Vérifier que la fonction existe et peut être appelée
    expect(typeof result.current.startDirectionalScroll).toBe('function');
  });

  it('gère la direction vers le haut', () => {
    const { result } = renderHook(() => useDirectionalScrollHandler({
      direction: 'haut',
      speed: 100,
      globalPathLength: 1000,
      progress: 0.5
    }));

    act(() => {
      result.current.startDirectionalScroll();
    });

    expect(typeof result.current.startDirectionalScroll).toBe('function');
  });

  it('gère la direction null', () => {
    const { result } = renderHook(() => useDirectionalScrollHandler({
      direction: null,
      speed: 100,
      globalPathLength: 1000,
      progress: 0.5
    }));

    act(() => {
      result.current.startDirectionalScroll();
    });

    expect(typeof result.current.startDirectionalScroll).toBe('function');
  });
}); 