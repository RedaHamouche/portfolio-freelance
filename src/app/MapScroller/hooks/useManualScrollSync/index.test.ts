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

describe('useManualScrollSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    window.scrollY = 0;
  });

  it('appelle onScrollState lors de l\'initialisation', () => {
    const onScrollState = jest.fn();
    const globalPathLength = 1000;
    
    renderHook(() => useManualScrollSync(globalPathLength, onScrollState));
    
    // Le hook appelle onScrollState(true) lors de l'initialisation
    expect(onScrollState).toHaveBeenCalledWith(true);
  });

  it('ajuste le scrollY quand il dépasse les limites', () => {
    const globalPathLength = 1000;
    const fakeScrollHeight = Math.round(globalPathLength * 1.5);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    
    // @ts-ignore
    window.scrollY = -10; // En dessous de 0
    
    renderHook(() => useManualScrollSync(globalPathLength));
    
    expect(window.scrollTo).toHaveBeenCalledWith(0, maxScroll - 2);
  });

  it('ne retourne rien (hook sans valeur de retour)', () => {
    const globalPathLength = 1000;
    const fakeScrollHeight = Math.round(globalPathLength * 1.5);
    const maxScroll = Math.max(1, fakeScrollHeight - window.innerHeight);
    
    // @ts-ignore
    window.scrollY = maxScroll / 2; // Au milieu
    
    const { result } = renderHook(() => useManualScrollSync(globalPathLength));
    
    // Le hook ne retourne rien, donc result.current est undefined
    expect(result.current).toBeUndefined();
  });
}); 