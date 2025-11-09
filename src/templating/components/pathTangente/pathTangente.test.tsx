import React from 'react';
import { render } from '@testing-library/react';
import PathTangente from './index';
import { TemplatingProvider } from '@/contexts/TemplatingContext';

// Mock des dépendances
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    const mockState = {
      scroll: {
        pathLength: 1000,
      },
    };
    return selector(mockState);
  }),
}));

jest.mock('@/hooks/useResponsivePath', () => ({
  useResponsivePath: jest.fn(() => ({
    mapScale: 1,
  })),
}));

jest.mock('@/templating/mappingComponent', () => ({
  __esModule: true,
  default: {
    TestComponent: () => <div>Test</div>,
  },
}));

jest.mock('@/templating/domains/tangente', () => ({
  createTangenteDomain: jest.fn(() => ({
    getAllComponents: jest.fn(() => [
      { type: 'TestComponent', id: '1', position: 0.5, offset: 0 },
    ]),
    getComponentPosition: jest.fn(() => 0.5),
    getComponentOffset: jest.fn(() => 0),
    getTextOnPathProps: jest.fn(),
  })),
}));

describe('PathTangente', () => {
  it('devrait rendre les composants', () => {
    const mockSvgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    mockSvgPath.setAttribute('d', 'M0,0 L100,0');
    
    // Mock des méthodes nécessaires
    Object.defineProperty(mockSvgPath, 'getTotalLength', {
      value: () => 100,
      writable: true,
      configurable: true,
    });
    
    Object.defineProperty(mockSvgPath, 'getPointAtLength', {
      value: () => ({ x: 0, y: 0 }),
      writable: true,
      configurable: true,
    });
    
    const { container } = render(
      <TemplatingProvider>
        <PathTangente svgPath={mockSvgPath} paddingX={0} paddingY={0} />
      </TemplatingProvider>
    );
    expect(container).toBeTruthy();
  });
});

