import React from 'react';
import { render } from '@testing-library/react';
import PathTangente from './index';

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

jest.mock('../mappingComponent', () => ({
  __esModule: true,
  default: {
    TestComponent: () => <div>Test</div>,
  },
}));

jest.mock('../domains/tangente', () => ({
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
    const mockSvgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const { container } = render(<PathTangente svgPath={mockSvgPath} paddingX={0} paddingY={0} />);
    expect(container).toBeTruthy();
  });
});

