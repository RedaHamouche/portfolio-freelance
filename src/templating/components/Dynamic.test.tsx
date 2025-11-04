import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dynamic from './Dynamic';
import { RootState } from '@/store';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

const mockIntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
  // Simuler que tous les éléments sont visibles après un court délai
  setTimeout(() => {
    const entry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
      target: document.createElement('div'),
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: 1,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };
    callback([entry as IntersectionObserverEntry], {} as IntersectionObserver);
  }, 0);
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  };
});

window.IntersectionObserver = mockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock Redux
const mockPathLength = 1000;
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: (state: RootState) => number) => {
    const mockState = {
      scroll: {
        pathLength: mockPathLength,
      },
    } as RootState;
    return selector(mockState);
  }),
}));

// Mock useResponsivePath
jest.mock('@/hooks/useResponsivePath', () => ({
  useResponsivePath: () => ({
    mapScale: 1,
    svgSize: { width: 2000, height: 1000 },
    mapPaddingRatio: 0.1,
  }),
}));

// Mock useBreakpoint
const mockUseBreakpoint = jest.fn(() => true);
jest.mock('@/hooks/useBreakpointValue', () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}));

// Mock getPointOnPath
const mockGetPointOnPath = jest.fn(() => ({ x: 100, y: 200 }));
jest.mock('@/utils/pathCalculations', () => ({
  getPointOnPath: () => mockGetPointOnPath(),
}));

// Mock calculateMapPadding
const mockCalculateMapPadding = jest.fn(() => ({
  paddingX: 200,
  paddingY: 100,
}));
jest.mock('@/utils/viewportCalculations', () => ({
  calculateMapPadding: () => mockCalculateMapPadding(),
}));

// Mock mappingComponent
jest.mock('../mappingComponent', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const MockComponent = ({ title, description }: { title?: string; description?: string }) =>
    React.createElement('div', { 'data-testid': 'mock-component' }, [
      title && React.createElement('h1', { key: 'title' }, title),
      description && React.createElement('p', { key: 'description' }, description),
    ].filter(Boolean));

  const MockBlackSquare = () => React.createElement('div', { 'data-testid': 'black-square' }, 'BlackSquare');
  const MockOpenModalButton = () => React.createElement('div', { 'data-testid': 'open-modal-button' }, 'OpenModalButton');

  return {
    __esModule: true,
    default: {
      TitleAboutMe: MockComponent,
      BlackSquare: MockBlackSquare,
      OpenModalButton: MockOpenModalButton,
    },
  };
});

describe('Dynamic', () => {
  let mockSvgPath: SVGPathElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPointOnPath.mockReturnValue({ x: 100, y: 200 });
    mockUseBreakpoint.mockReturnValue(true);
    
    // Créer un mock SVGPathElement
    mockSvgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    mockSvgPath.setAttribute('d', 'M0 0 L100 100');
    
    // Mock getTotalLength
    Object.defineProperty(mockSvgPath, 'getTotalLength', {
      value: jest.fn(() => mockPathLength),
      writable: true,
    });
  });

  it('devrait rendre les composants du config', () => {
    render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    // Le composant TitleAboutMe devrait être rendu avec les données de page.json
    expect(screen.getByText('À propos')).toBeInTheDocument();
  });

  it('devrait calculer correctement originPoint avec svgPath', () => {
    render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    expect(mockGetPointOnPath).toHaveBeenCalled();
  });

  it('devrait utiliser originPoint (0,0) si svgPath est null', () => {
    render(<Dynamic svgPath={null} paddingX={200} paddingY={100} />);
    
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    // Le composant devrait être rendu même sans svgPath
  });

  it('devrait calculer correctement les positions responsive (desktop)', () => {
    mockUseBreakpoint.mockReturnValue(true);
    const { container } = render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    const componentDiv = container.querySelector('[data-component-type="TitleAboutMe"]');
    expect(componentDiv).toBeInTheDocument();
    
    // originPoint = (100 + 200, 200 + 100) = (300, 300)
    // desktop position = top: 300, left: -20 (d'après page.json)
    // Calculé = top: 300 + 300 = 600, left: 300 + (-20) = 280
    expect(componentDiv).toHaveStyle({ top: '600px', left: '280px' });
  });

  it('devrait calculer correctement les positions responsive (mobile)', () => {
    mockUseBreakpoint.mockReturnValue(false);
    const { container } = render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    const componentDiv = container.querySelector('[data-component-type="TitleAboutMe"]');
    expect(componentDiv).toBeInTheDocument();
    
    // originPoint = (100 + 200, 200 + 100) = (300, 300)
    // mobile position = top: -200, left: -140 (d'après page.json)
    // Calculé = top: 300 + (-200) = 100, left: 300 + (-140) = 160
    expect(componentDiv).toHaveStyle({ top: '100px', left: '160px' });
  });

  it('devrait calculer correctement les positions responsive pour TitleAboutMe avec desktop position différente', () => {
    mockUseBreakpoint.mockReturnValue(true);
    const { container } = render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    const componentDiv = container.querySelector('[data-component-type="TitleAboutMe"]');
    expect(componentDiv).toBeInTheDocument();
    
    // originPoint = (100 + 200, 200 + 100) = (300, 300)
    // desktop position = top: 300, left: -20 (d'après page.json)
    // Calculé = top: 300 + 300 = 600, left: 300 + (-20) = 280
    expect(componentDiv).toHaveStyle({ top: '600px', left: '280px' });
  });

  it('devrait calculer le padding si non fourni', () => {
    render(<Dynamic svgPath={mockSvgPath} />);
    
    expect(mockCalculateMapPadding).toHaveBeenCalled();
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
  });

  it('devrait utiliser le padding fourni en props', () => {
    render(<Dynamic svgPath={mockSvgPath} paddingX={150} paddingY={75} />);
    
    // Le padding calculé ne devrait pas être utilisé
    expect(mockCalculateMapPadding).not.toHaveBeenCalled();
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
  });

  it('devrait gérer les composants sans position', () => {
    render(<Dynamic svgPath={mockSvgPath} />);
    // Le composant devrait être rendu même sans position définie
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
  });

  it('devrait gérer les erreurs lors du calcul de originPoint', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGetPointOnPath.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Dynamic: Error calculating originPoint',
      expect.any(Error)
    );
    expect(screen.getByTestId('mock-component')).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  it('devrait gérer les valeurs négatives pour top et left', () => {
    // Test avec des valeurs négatives (positionnement en bas/droite)
    const { container } = render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    // Les valeurs négatives devraient être acceptées
    const componentDiv = container.querySelector('[data-component-type="TitleAboutMe"]');
    expect(componentDiv).toBeInTheDocument();
  });

  it('devrait appliquer les styles corrects aux composants', () => {
    const { container } = render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    const componentDiv = container.querySelector('[data-component-type="TitleAboutMe"]');
    expect(componentDiv).toHaveStyle({
      position: 'absolute',
      pointerEvents: 'auto',
      transformOrigin: 'top left',
      zIndex: '10',
    });
  });

  it('devrait passer les props correctes aux composants', () => {
    render(<Dynamic svgPath={mockSvgPath} paddingX={200} paddingY={100} />);
    
    // Vérifier que les props de page.json sont passées correctement
    expect(screen.getByText('À propos')).toBeInTheDocument();
    expect(screen.getByText(/Développeur freelance/)).toBeInTheDocument();
  });
});
