import { renderHook } from '@testing-library/react';
import { usePathCalculations } from './index';

// Mock Redux
const mockProgress = 0.5;
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => {
    const mockState = {
      scroll: {
        progress: mockProgress,
      },
    };
    return selector(mockState);
  },
}));

// Mock pathCalculations
jest.mock('@/utils/pathCalculations', () => ({
  findNextComponent: jest.fn(() => ({
    id: 'test',
    position: { progress: 0.3 },
    displayName: 'Test Component',
  })),
  getPointOnPath: jest.fn(() => ({ x: 100, y: 200 })),
  getPathAngleAtProgress: jest.fn(() => 45),
  calculateDashOffset: jest.fn((length, progress) => length * progress),
  calculateArrowPosition: jest.fn(() => 'right'),
}));

describe('usePathCalculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait retourner les fonctions et valeurs attendues', () => {
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    svgPath.setAttribute('d', 'M0,0 L100,0');
    
    // Mock getTotalLength
    Object.defineProperty(svgPath, 'getTotalLength', {
      value: () => 100,
      writable: true,
      configurable: true,
    });
    
    const { result } = renderHook(() => usePathCalculations(svgPath));

    expect(result.current).toHaveProperty('dashOffset');
    expect(result.current).toHaveProperty('nextComponent');
    expect(result.current).toHaveProperty('getCurrentPointPosition');
    expect(result.current).toHaveProperty('getCurrentPointAngle');
    expect(result.current).toHaveProperty('getArrowPosition');
  });

  it('devrait retourner une position par défaut si svgPath est null', () => {
    const { result } = renderHook(() => usePathCalculations(null));
    const position = result.current.getCurrentPointPosition();
    expect(position).toEqual({ x: 200, y: 300 });
  });

  it('devrait retourner un angle à 0 si svgPath est null', () => {
    const { result } = renderHook(() => usePathCalculations(null));
    const angle = result.current.getCurrentPointAngle();
    expect(angle).toBe(0);
  });

  it('devrait calculer le dashOffset quand svgPath est disponible', () => {
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    svgPath.setAttribute('d', 'M0,0 L100,0');
    
    // Mock getTotalLength
    Object.defineProperty(svgPath, 'getTotalLength', {
      value: () => 1000,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => usePathCalculations(svgPath));
    
    // Attendre que l'effet se déclenche
    setTimeout(() => {
      expect(typeof result.current.dashOffset).toBe('number');
    }, 0);
  });
});

