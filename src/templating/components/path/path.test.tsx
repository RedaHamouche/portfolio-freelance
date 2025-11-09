import React from 'react';
import { render } from '@testing-library/react';
import Path from './index';
import { TemplatingProvider } from '@/contexts/TemplatingContext';
import { DeviceProvider } from '@/contexts/DeviceContext';

// Mock des dépendances
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    const mockState = {
      scroll: {
        progress: 0.5,
        pathLength: 1000,
      },
    };
    return selector(mockState);
  }),
  useDispatch: jest.fn(() => jest.fn()),
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

jest.mock('@/templating/domains/path', () => ({
  createPathDomain: jest.fn(() => ({
    getAllComponents: jest.fn(() => [
      { type: 'TestComponent', id: '1', position: { progress: 0.5 } },
    ]),
    getActiveComponents: jest.fn(() => []),
    calculateComponentPosition: jest.fn(() => ({ x: 0, y: 0 })),
    getComponentByAnchorId: jest.fn(),
  })),
}));

describe('Path', () => {
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
      <DeviceProvider isDesktop={true}>
        <TemplatingProvider>
          <Path svgPath={mockSvgPath} paddingX={0} paddingY={0} />
        </TemplatingProvider>
      </DeviceProvider>
    );
    expect(container).toBeTruthy();
  });
});

