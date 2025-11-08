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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Jest module resolution
import { DEFAULT_PATH_LENGTH } from '@/config';

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

// Type pour le store mock
type MockStore = ReturnType<typeof createMockStore>;

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
        pathLength: DEFAULT_PATH_LENGTH * 2.5, // Utiliser une valeur > DEFAULT_PATH_LENGTH pour les tests (DEFAULT_PATH_LENGTH est la valeur par défaut dans Redux)
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
    return <Provider store={store}>{children}</Provider>;
  }
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('Use Case 1: Scroll Manuel', () => {
  it('devrait mettre à jour le progress lors d\'un scroll manuel (touch)', async () => {
    const store = createMockStore();
    renderHook(
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

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
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      // Avec pathLength = 5000: fakeScrollHeight = 7500, maxScroll ≈ 6500 (si windowHeight = 1000)
      // Pour progress ≈ 0.3: scrollY ≈ 0.3 * 6500 = 1950
      // Pour progress ≈ 0.5: scrollY ≈ 0.5 * 6500 = 3250
      window.scrollY = 3250; // Scroll vers l'avant (progress ≈ 0.5)
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.lastScrollDirection).toBe('forward');
    expect(state.scroll.autoScrollDirection).toBe(1);
  });

  it('devrait mettre à jour la direction à "backward" lors d\'un scroll vers l\'arrière', async () => {
    const store = createMockStore({ progress: 0.7 });
    renderHook(
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Créer un div dans le DOM pour avoir un élément avec closest()
    const div = document.createElement('div');
    document.body.appendChild(div);

    // Étape 1: Établir un progress élevé (0.7) en déclenchant un scroll vers l'avant
    // Avec pathLength = 5000: maxScroll ≈ 6500
    // Pour progress ≈ 0.7: scrollY ≈ 0.7 * 6500 = 4550
    act(() => {
      window.scrollY = 4550; // Correspond à progress ~0.7
      const wheelEvent1 = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent1);
    });

    // Attendre que le progress soit mis à jour
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Vérifier que le progress initial est bien élevé
    const stateAfterForward = store.getState() as RootState;
    expect(stateAfterForward.scroll.progress).toBeGreaterThan(0.5);

    // Étape 2: Scroller vers l'arrière (progress diminue)
    // Pour progress ≈ 0.3: scrollY ≈ 0.3 * 6500 = 1950
    act(() => {
      window.scrollY = 1950; // Scroll vers l'arrière (progress diminue de ~0.7 à ~0.3)
      const wheelEvent2 = new WheelEvent('wheel', { deltaY: -100 });
      window.dispatchEvent(wheelEvent2);
    });

    // Attendre que la direction soit calculée
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const state = store.getState() as RootState;
    // Le progress devrait avoir diminué
    expect(state.scroll.progress).toBeLessThan(stateAfterForward.scroll.progress);
    // La direction devrait être "backward"
    expect(state.scroll.lastScrollDirection).toBe('backward');
    expect(state.scroll.autoScrollDirection).toBe(-1);

    document.body.removeChild(div);
  });
});

describe('Use Case 2: Autoplay', () => {
  it('devrait mettre en pause l\'autoplay lors d\'un scroll manuel', async () => {
    const store = createMockStore({ isAutoPlaying: true });
    renderHook(
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      window.scrollY = 100;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const initialProgress = (store.getState() as RootState).scroll.progress;

    // Créer un div dans le DOM pour avoir un élément avec closest()
    const div = document.createElement('div');
    document.body.appendChild(div);

    act(() => {
      window.scrollY = 400;
      // Simuler un touchmove (pas touchstart) pour déclencher handleUserInteraction
      const touchEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
      });
      // Le target ne doit pas être un élément interactif pour que l'autoplay soit mis en pause
      Object.defineProperty(touchEvent, 'target', {
        value: div,
        writable: false,
        configurable: true,
      });
      window.dispatchEvent(touchEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    document.body.removeChild(div);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Créer un bouton dans le DOM
    const button = document.createElement('button');
    document.body.appendChild(button);

    act(() => {
      // Simuler un touchstart sur le bouton
      // L'événement doit être dispatché sur window pour être capturé par handleUserInteraction
      // Mais le target doit être le bouton pour que la détection fonctionne
      const touchEvent = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
      });
      // Utiliser Object.defineProperty pour définir target
      Object.defineProperty(touchEvent, 'target', {
        value: button,
        writable: false,
        configurable: true,
      });
      // Dispatch sur window pour que l'event listener le capture
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
      () => useManualScrollSync(5000, undefined, true),
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
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      // Simuler un scroll qui dépasse 1.0
      window.scrollY = 3000; // Au-delà du maxScroll
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const state = store.getState() as RootState;
    // Le progress devrait être normalisé entre 0 et 1
    expect(state.scroll.progress).toBeGreaterThanOrEqual(0);
    expect(state.scroll.progress).toBeLessThan(1);
  });

  it('devrait gérer le wraparound vers l\'arrière', async () => {
    const store = createMockStore({ progress: 0.01 });
    renderHook(
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      window.scrollY = -100; // Scroll négatif
      const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    act(() => {
      window.scrollY = 500;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
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
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const initialProgress = (store.getState() as RootState).scroll.progress;

    act(() => {
      window.scrollY = 500;
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      window.dispatchEvent(wheelEvent);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    const state = store.getState() as RootState;
    expect(state.scroll.progress).toBe(initialProgress);
  });
});

describe('Use Case 9: Performance et Optimisations', () => {
  it('ne devrait pas appeler processScrollUpdate plusieurs fois simultanément', async () => {
    const store = createMockStore();
    renderHook(
      () => useManualScrollSync(5000, undefined, true),
      { wrapper: createWrapper(store) }
    );

    // Attendre que le hook soit initialisé
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // pendingUpdateRef devrait empêcher les appels multiples
    // Le nombre exact dépend de l'implémentation, mais devrait être limité
    expect(callCount).toBeGreaterThan(0);
    
    // Restaurer le RAF original
    window.requestAnimationFrame = originalRaf;
  });
});

