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

// Mock requestAnimationFrame
let rafCallbacks: FrameRequestCallback[] = [];
const mockRequestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});
const mockCancelAnimationFrame = jest.fn();
Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});
Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true
});

// Mock Redux
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) => {
    // Simuler le state Redux pour les tests
    const mockState = {
      modal: { isOpen: false },
      scroll: { progress: 0.5, pathLength: 1000 }
    };
    return selector(mockState);
  }
}));

// Mock useThrottle
jest.mock('@uidotdev/usehooks', () => ({
  useThrottle: jest.fn((value) => value) // Retourne la valeur directement pour les tests
}));

// Mock ScrollContext
// Note: Dans les mocks Jest, require() est nécessaire car les imports ES6 ne fonctionnent pas dans ce contexte
jest.mock('../../contexts/ScrollContext', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { ScrollEasingService, EasingFunctions } = require('./domain/ScrollEasingService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { ScrollProgressCalculator } = require('./domain/ScrollProgressCalculator');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { ScrollStateDetector } = require('./domain/ScrollStateDetector');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { ScrollVelocityService } = require('./domain/ScrollVelocityService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { createPathDomain } = require('@/templating/domains/path');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { ProgressInitializationService } = require('../useScrollInitialization/domain/ProgressInitializationService');
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nécessaire dans les mocks Jest
  const { SCROLL_INERTIA_FACTOR, SCROLL_EASING_TYPE, SCROLL_EASING_MIN_DELTA, SCROLL_VELOCITY_CONFIG } = require('@/config');

  const easingFunction = EasingFunctions[SCROLL_EASING_TYPE] || EasingFunctions.linear;
  const easingService = new ScrollEasingService(SCROLL_INERTIA_FACTOR, easingFunction, SCROLL_EASING_MIN_DELTA);
  const progressCalculator = new ScrollProgressCalculator();
  const stateDetector = new ScrollStateDetector(150);
  const velocityConfig = SCROLL_VELOCITY_CONFIG.desktop;
  const velocityService = new ScrollVelocityService(velocityConfig.friction, velocityConfig.maxVelocity);
  const pathDomain = createPathDomain();
  const progressInitService = new ProgressInitializationService();

  return {
    useScrollContext: () => ({
      easingService,
      progressCalculator,
      stateDetector,
      velocityService,
      pathDomain,
      progressInitService,
      velocityConfig: {
        enabled: SCROLL_VELOCITY_CONFIG.enabled,
        ...velocityConfig,
      },
      easingFunction,
      isDesktop: true,
    }),
  };
});

describe('useManualScrollSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollY = 0;
    rafCallbacks = [];
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

  it('ajuste le scrollY quand il dépasse les limites', async () => {
    const globalPathLength = 1000;
    
    window.scrollY = -10; // En dessous de 0
    
    renderHook(() => useManualScrollSync(globalPathLength));
    
    // Déclencher un événement scroll pour que processScrollUpdate soit appelé
    window.dispatchEvent(new Event('scroll'));
    
    // Exécuter les callbacks RAF
    rafCallbacks.forEach(cb => cb(performance.now()));
    rafCallbacks = [];
    
    // Attendre un peu pour que tout soit traité
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    // Le use case devrait corriger le scrollY négatif
    // La correction se fait dans processScrollUpdate via useCase.updateScrollPosition
    expect(window.scrollTo).toHaveBeenCalled();
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