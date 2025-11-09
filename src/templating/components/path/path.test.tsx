import React from 'react';
import { render } from '@testing-library/react';
import Path from './index';

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

jest.mock('../mappingComponent', () => ({
  __esModule: true,
  default: {
    TestComponent: () => <div>Test</div>,
  },
}));

jest.mock('../domains/path', () => ({
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
    const mockSvgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const { container } = render(<Path svgPath={mockSvgPath} paddingX={0} paddingY={0} />);
    expect(container).toBeTruthy();
  });
});

