import React from 'react';
import { render } from '@testing-library/react';
import Dynamic from './index';

// Mock des dépendances
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => 1000),
}));

jest.mock('@/hooks/useResponsivePath', () => ({
  useResponsivePath: jest.fn(() => ({
    mapScale: 1,
    svgSize: { width: 1000, height: 1000 },
    mapPaddingRatio: 0.1,
  })),
}));

jest.mock('../mappingComponent', () => ({
  __esModule: true,
  default: {
    TestComponent: () => <div>Test</div>,
  },
}));

jest.mock('../domains/page', () => ({
  createPageDomain: jest.fn(() => ({
    getComponents: jest.fn(() => [
      { type: 'TestComponent', id: '1', position: { x: 0, y: 0 } },
    ]),
    calculatePosition: jest.fn(() => ({ top: 0, left: 0 })),
  })),
}));

describe('Dynamic', () => {
  it('devrait rendre les composants', () => {
    const { container } = render(<Dynamic />);
    expect(container).toBeTruthy();
  });
});

