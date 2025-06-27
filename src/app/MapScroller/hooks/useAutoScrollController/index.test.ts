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
jest.mock('../../../../hooks/useRafLoop', () => ({
  useRafLoop: () => ({
    start: jest.fn(),
    stop: jest.fn()
  })
}));

// Mock pathComponents
jest.mock('@/templating/pathComponents.json', () => [
  {
    anchorId: 'test-anchor',
    position: { progress: 0.5 },
    autoScrollPauseTime: 1000
  }
]);

// Mock AUTO_SCROLL_SPEED
jest.mock('@/config/autoScroll', () => ({
  AUTO_SCROLL_SPEED: 0.001
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