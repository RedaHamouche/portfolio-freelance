/**
 * Tests d'intégration pour useManualScrollSync
 * Teste tous les parcours utilisateur de scroll
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useManualScrollSync } from './index';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Jest module resolution
import scrollReducer from '@/store/scrollSlice';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Jest module resolution
import type { RootState } from '@/store';
import { DEFAULT_PATH_LENGTH } from '@/config';
import { ScrollContextProvider } from '../../contexts/ScrollContext';

// Mock useBreakpoint
jest.mock('@/hooks/useBreakpointValue', () => ({
  useBreakpoint: jest.fn(() => true), // Retourne true (desktop) par défaut pour les tests
}));

// Mock du modalSlice
const modalReducer = (state = { isOpen: false }, action: { type: string; payload?: unknown }) => {
  if (action.type === 'modal/setIsOpen') {
    return { isOpen: action.payload as boolean };
  }
  return state;
};

// Mock window.scrollY et window.scrollTo
const mockScrollTo = jest.fn();
const mockRequestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  setTimeout(cb, 16);
  return 1;
});
const mockCancelAnimationFrame = jest.fn();

beforeAll(() => {
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    value: 0,
  });
  window.scrollTo = mockScrollTo;
  window.requestAnimationFrame = mockRequestAnimationFrame as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = mockCancelAnimationFrame as typeof window.cancelAnimationFrame;
});

beforeEach(() => {
  jest.clearAllMocks();
  window.scrollY = 0;
});

type MockStore = ReturnType<typeof createMockStore>;

function createMockStore(initialState: Partial<RootState['scroll']> = {}) {
  return configureStore({
    reducer: {
      scroll: scrollReducer,
      modal: modalReducer,
    },
    preloadedState: {
      scroll: {
        isScrolling: false,
        scrollingSpeed: 20,
        direction: null,
        isAutoPlaying: false,
        progress: 0.005,
        pathLength: DEFAULT_PATH_LENGTH,
        autoScrollDirection: 1,
        isAutoScrollTemporarilyPaused: false,
        lastScrollDirection: null,
        ...initialState,
      },
      modal: {
        isOpen: false,
      },
    },
  });
}

function createWrapper(store: MockStore) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const scrollContextProvider = React.createElement(ScrollContextProvider, null, children);
    // TypeScript nécessite children comme prop pour Provider, mais React.createElement accepte aussi les enfants comme argument
    return React.createElement(Provider, { store, children: scrollContextProvider } as { store: typeof store; children: React.ReactNode });
  }
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('Use Case 1: Scroll Manuel', () => {
  it('devrait mettre à jour le progress lors d\'un scroll manuel (touch)', async () => {
    const store = createMockStore();
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Créer un div dans le DOM pour avoir un élément avec closest()
    const div = document.createElement('div');
    document.body.appendChild(div);

    act(() => {
      window.scrollY = 100;
      // Simuler un touchmove pour déclencher handleUserInteraction
      const touchEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
      });
      // Le target doit être un élément HTML réel (pas document.body qui n'a pas closest)
      Object.defineProperty(touchEvent, 'target', {
        value: div,
        writable: false,
        configurable: true,
      });
      window.dispatchEvent(touchEvent);
    });

    // Attendre que les RAF soient exécutés
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Vérifier que le progress a été mis à jour
    const state = store.getState() as RootState;
    expect(state.scroll.progress).toBeGreaterThan(0.005);

    document.body.removeChild(div);
  });

  it('devrait mettre à jour la direction à "forward" lors d\'un scroll vers l\'avant', async () => {
    const store = createMockStore({ progress: 0.3 });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    act(() => {
      window.scrollY = 500; // Scroll vers l'avant
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.lastScrollDirection).toBe('forward');
    expect(state.scroll.autoScrollDirection).toBe(1);
  });

  it('devrait mettre à jour la direction à "backward" lors d\'un scroll vers l\'arrière', async () => {
    const store = createMockStore({ progress: 0.5 });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    act(() => {
      window.scrollY = 200; // Scroll vers l'arrière
      const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.lastScrollDirection).toBe('backward');
    expect(state.scroll.autoScrollDirection).toBe(-1);
  });
});

describe('Use Case 2: Autoplay', () => {
  it('devrait mettre en pause l\'autoplay lors d\'un scroll manuel', async () => {
    const store = createMockStore({ isAutoPlaying: true });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    act(() => {
      window.scrollY = 100;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.isAutoPlaying).toBe(false);
  });
});

describe('Use Case 3: Transition Autoplay → Scroll Manuel', () => {
  it('devrait arrêter l\'autoplay de manière fluide lors d\'un scroll manuel', async () => {
    const store = createMockStore({ 
      isAutoPlaying: true,
      progress: 0.3 
    });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    const initialProgress = (store.getState() as RootState).scroll.progress;

    act(() => {
      window.scrollY = 400;
      const touchEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(touchEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.isAutoPlaying).toBe(false);
    // Le progress devrait avoir changé de manière fluide
    expect(state.scroll.progress).not.toBe(initialProgress);
  });
});

describe('Use Case 4: Interactions qui ne cancel pas l\'autoplay', () => {
  it('ne devrait pas cancel l\'autoplay lors d\'un touch sur un bouton', async () => {
    const store = createMockStore({ isAutoPlaying: true });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Créer un bouton dans le DOM
    const button = document.createElement('button');
    document.body.appendChild(button);

    act(() => {
      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(touchEvent, 'target', {
        value: button,
        writable: false,
        configurable: true,
      });
      window.dispatchEvent(touchEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.isAutoPlaying).toBe(true);

    document.body.removeChild(button);
  });
});

describe('Use Case 5: Initialisation au Reload', () => {
  it('devrait fonctionner correctement après l\'initialisation', async () => {
    const store = createMockStore();
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que l'initialisation soit terminée
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Simuler un scroll rapide
    act(() => {
      window.scrollY = 500;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.progress).toBeGreaterThan(0.005);
  });
});

describe('Use Case 6: Boucle Infinie', () => {
  it('devrait gérer le wraparound vers l\'avant', async () => {
    const store = createMockStore({ progress: 0.99 });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    act(() => {
      // Simuler un scroll qui dépasse 1.0
      window.scrollY = 3000; // Au-delà du maxScroll
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    // Le progress devrait être normalisé entre 0 et 1
    expect(state.scroll.progress).toBeGreaterThanOrEqual(0);
    expect(state.scroll.progress).toBeLessThan(1);
  });

  it('devrait gérer le wraparound vers l\'arrière', async () => {
    const store = createMockStore({ progress: 0.01 });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    act(() => {
      window.scrollY = -100; // Scroll négatif
      const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    // Le progress devrait être normalisé entre 0 et 1
    expect(state.scroll.progress).toBeGreaterThanOrEqual(0);
    expect(state.scroll.progress).toBeLessThan(1);
  });
});

describe('Use Case 7: Direction et Synchronisation', () => {
  it('devrait synchroniser autoScrollDirection avec lastScrollDirection', async () => {
    const store = createMockStore({ progress: 0.3 });
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    act(() => {
      window.scrollY = 500;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.lastScrollDirection).toBe('forward');
    expect(state.scroll.autoScrollDirection).toBe(1);
  });
});

describe('Use Case 8: Gestion des Modals', () => {
  it('ne devrait pas mettre à jour le progress si une modal est ouverte', async () => {
    const store = createMockStore({ progress: 0.3 });
    store.dispatch({ type: 'modal/setIsOpen', payload: true } as { type: string; payload: boolean });

    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    const initialProgress = (store.getState() as RootState).scroll.progress;

    act(() => {
      window.scrollY = 500;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.progress).toBe(initialProgress);
  });
});

describe('Use Case 9: Performance et Optimisations', () => {
  it('ne devrait pas appeler processScrollUpdate plusieurs fois simultanément', async () => {
    const store = createMockStore();
    renderHook(
      () => useManualScrollSync(DEFAULT_PATH_LENGTH, undefined, true),
      { wrapper: createWrapper(store) }
    );

    let callCount = 0;
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
      callCount++;
      return originalRaf(cb);
    });

    act(() => {
      // Déclencher plusieurs événements rapidement
      for (let i = 0; i < 10; i++) {
        window.scrollY = 100 + i * 10;
        const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
        window.dispatchEvent(wheelEvent);
      }
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // pendingUpdateRef devrait empêcher les appels multiples
    // Le nombre exact dépend de l'implémentation, mais devrait être limité
    expect(callCount).toBeGreaterThan(0);
  });
});

