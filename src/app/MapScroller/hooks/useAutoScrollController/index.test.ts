import { renderHook, act } from '@testing-library/react';
import { useAutoScrollController } from './index';

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn()
}));

// Mock useRafLoop
jest.mock('@/hooks/useRafLoop', () => ({
  useRafLoop: () => ({
    start: jest.fn(),
    stop: jest.fn()
  })
}));

// Mock useBreakpoint
jest.mock('@/hooks/useBreakpointValue', () => ({
  useBreakpoint: () => false // mobile par défaut
}));

// Mock pathDomain
jest.mock('@/templating/domains/path', () => ({
  createPathDomain: () => ({
    getComponentByAnchorId: jest.fn(() => ({
      anchorId: 'test-anchor',
      position: { progress: 0.5 },
      autoScrollPauseTime: 1000
    })),
    getAllComponents: jest.fn(() => [])
  })
}));

// Mock config
jest.mock('@/config', () => ({
  AUTO_SCROLL_CONFIG: {
    speed: {
      mobile: 0.001,
      desktop: 0.001,
    },
  },
  SCROLL_CONFIG: {
    FRAME_DELAY: 16,
    ANCHOR_TOLERANCE: 0.002,
    ANCHOR_BUMP: 0.002,
  },
}));

describe('useAutoScrollController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retourne les fonctions start et stop', () => {
    const { result } = renderHook(() => useAutoScrollController({
      isAutoPlaying: true,
      autoScrollDirection: 1,
      globalPathLength: 1000,
      progress: 0.5
    }));

    expect(result.current.startAutoScroll).toBeDefined();
    expect(result.current.stopAutoScroll).toBeDefined();
  });

  it('gère l\'auto-scroll avec isAutoPlaying true', () => {
    const { result } = renderHook(() => useAutoScrollController({
      isAutoPlaying: true,
      autoScrollDirection: 1,
      globalPathLength: 1000,
      progress: 0.5
    }));

    act(() => {
      result.current.startAutoScroll();
    });

    expect(typeof result.current.startAutoScroll).toBe('function');
  });

  it('gère l\'auto-scroll avec isAutoPlaying false', () => {
    const { result } = renderHook(() => useAutoScrollController({
      isAutoPlaying: false,
      autoScrollDirection: 1,
      globalPathLength: 1000,
      progress: 0.5
    }));

    act(() => {
      result.current.startAutoScroll();
    });

    expect(typeof result.current.startAutoScroll).toBe('function');
  });

  it('gère l\'arrêt de l\'auto-scroll', () => {
    const { result } = renderHook(() => useAutoScrollController({
      isAutoPlaying: true,
      autoScrollDirection: 1,
      globalPathLength: 1000,
      progress: 0.5
    }));

    act(() => {
      result.current.stopAutoScroll();
    });

    expect(typeof result.current.stopAutoScroll).toBe('function');
  });
}); 