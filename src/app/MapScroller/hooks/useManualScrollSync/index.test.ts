import { renderHook } from '@testing-library/react';
import { useManualScrollSync } from './index';

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true
});

// Mock window.innerHeight
Object.defineProperty(window, 'innerHeight', {
  value: 800,
  writable: true
});

// Mock Redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn()
}));

// Mock useThrottle
jest.mock('@uidotdev/usehooks', () => ({
  useThrottle: jest.fn((value) => value) // Retourne la valeur directement pour les tests
}));

describe('useManualScrollSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollY = 0;
  });

  it('appelle onScrollState lors du scroll', () => {
    const onScrollState = jest.fn();
    const globalPathLength = 1000;
    
    renderHook(() => useManualScrollSync(globalPathLength, onScrollState));
    
    // Simuler un événement de scroll
    window.scrollY = 100;
    window.dispatchEvent(new Event('scroll'));
    
    // onScrollState devrait être appelé lors du scroll
    expect(onScrollState).toHaveBeenCalled();
  });

  it('ajuste le scrollY quand il dépasse les limites', () => {
    const globalPathLength = 1000;
    const fakeScrollHeight = Math.round(globalPathLength * 1.5);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    
    window.scrollY = -10; // En dessous de 0
    
    renderHook(() => useManualScrollSync(globalPathLength));
    
    expect(window.scrollTo).toHaveBeenCalledWith(0, maxScroll - 2);
  });

  it('ne retourne rien (hook sans valeur de retour)', () => {
    const globalPathLength = 1000;
    const fakeScrollHeight = Math.round(globalPathLength * 1.5);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    
    window.scrollY = maxScroll / 2; // Au milieu
    
    const { result } = renderHook(() => useManualScrollSync(globalPathLength));
    
    // Le hook ne retourne rien, donc result.current est undefined
    expect(result.current).toBeUndefined();
  });
}); 